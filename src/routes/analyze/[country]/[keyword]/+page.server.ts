import type { PageServerLoad } from './$types';
import type { RawApiResponse, AnalysisResult, AppItem, SeedingTarget, Verdict } from '$lib/types';
import { DOMAIN_CATEGORIES } from '$lib/constants';
import { adminDB } from '$lib/server/firebase';

// --- HELPERS (Giữ nguyên để xử lý hiển thị) ---
function unslugify(slug: string) {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getBrandName(input: string): string {
    if (!input) return '';
    let urlLike = input.trim();
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(urlLike)) {
        urlLike = 'https://' + urlLike;
    }
    try {
        const hostname = new URL(urlLike).hostname.toLowerCase();
        const parts = hostname.replace(/^(www|m|app)\./, '').split('.');
        if (parts.length < 2) return parts[0] || 'Site';
        return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
    } catch {
        return 'Site';
    }
}

function extractMetaFromOrganic(item: any): string {
    const displayed = item.displayed_link?.toLowerCase() || '';
    if (displayed.includes('ago') || displayed.includes('comment') || displayed.includes('answer')) {
        return item.displayed_link;
    }
    return `Rank #${item.position}`;
}

function getDomainCategory(domain: string): keyof typeof DOMAIN_CATEGORIES | 'UNKNOWN' {
    const d = domain.toLowerCase();
    for (const [category, keywords] of Object.entries(DOMAIN_CATEGORIES)) {
        if (keywords.some(k => d.includes(k))) return category as keyof typeof DOMAIN_CATEGORIES;
    }
    return 'UNKNOWN';
}

// Basic Parser (Dùng để fallback nếu DB chưa có processed_apps xịn, hoặc để lấy Seeding Targets)
function createBasicAppItem(item: any, domainCategory: string): AppItem | null {
    if (domainCategory === 'FORUM') return null;

    const snippet = (item.snippet || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const fullText = `${title} ${snippet}`;
    
    // Rich Snippet extraction (Simplified)
    const extensions = item.rich_snippet?.top?.extensions || [];
    const detectedExt = item.rich_snippet?.top?.detected_extensions || {};
    
    let rating: number | undefined;
    let reviewCount: string | undefined;
    let pricing: string = 'Unknown';
    let type: 'app' | 'template' | 'resource' = 'app';

    // Pricing & Rating Logic
    extensions.forEach((ext: string) => {
        const e = ext.toLowerCase().trim();
        const rateMatch = e.match(/^(\d(\.\d)?)/); 
        if (rateMatch) {
            const val = parseFloat(rateMatch[1]);
            if (!isNaN(val) && val >= 0 && val <= 5) rating = val;
        }
        if (e === 'free' || e.includes('free forever')) pricing = 'Free';
        else if (e.includes('free trial')) pricing = 'Free Trial';
        else if (e.includes('price') || e.includes('buy')) pricing = 'Paid';
    });

    if (!rating && detectedExt.rating) rating = detectedExt.rating;
    if (!reviewCount && detectedExt.reviews) reviewCount = detectedExt.reviews;

    // Type Logic
    if (fullText.includes('template') || fullText.includes('theme')) type = 'template';
    else if (fullText.includes('list of') || fullText.includes('best')) type = 'resource';

    if (pricing === 'Unknown') {
        if (fullText.includes('free')) pricing = 'Freemium';
    }

    let features = extensions.filter((ext: string) => {
        const l = ext.toLowerCase();
        return !l.includes('free') && !l.includes('trial') && !l.includes('price') && !/^\d/.test(l);
    }).slice(0, 3);

    return {
        name: getBrandName(item.domain), 
        domain: item.domain || '',
        url: item.link || '',
        description: item.snippet || '', 
        type, 
        pricingModel: pricing as any, 
        features, 
        rating,
        reviewCount, 
        ctaText: 'Visit'
    };
}

function removeDuplicateApps(apps: AppItem[]): AppItem[] {
    const uniqueMap = new Map<string, AppItem>();
    for (const app of apps) {
        const domainKey = app.domain.toLowerCase().replace(/^www\./, '');
        if (!uniqueMap.has(domainKey)) uniqueMap.set(domainKey, app);
    }
    return Array.from(uniqueMap.values());
}

function sortAppsSmart(apps: AppItem[]) {
    return apps.sort((a, b) => {
        let scoreA = (a.type === 'app' ? 20 : 0) + (a.rating || 0) * 2;
        let scoreB = (b.type === 'app' ? 20 : 0) + (b.rating || 0) * 2;
        return scoreB - scoreA;
    });
}

async function getInternalLinks(country: string, currentKeyword: string): Promise<string[]> {
    try {
        const snapshot = await adminDB.collection('analysis')
            .where('country', '==', country.toLowerCase())
            .orderBy('created_at', 'desc')
            .limit(20) 
            .select('keyword')
            .get();

        const links = snapshot.docs
            .map(d => d.data().keyword)
            .filter(k => k && k.toLowerCase() !== currentKeyword.toLowerCase());
        
        return links.sort(() => 0.5 - Math.random()).slice(0, 8);
    } catch (e) {
        return []; 
    }
}

// --- MAIN LOAD FUNCTION ---
export const load: PageServerLoad = async ({ params }) => {
    const { country, keyword: rawKeyword } = params;
    const readableKeyword = unslugify(rawKeyword);
    const docId = `${country.toLowerCase()}_${rawKeyword}`;

    const loadAnalysisData = async (): Promise<AnalysisResult> => {
        let rawData: RawApiResponse | null = null;
        let marketReport = '';
        let apps: AppItem[] = [];
        let seedingTargets: SeedingTarget[] = [];
        let pivotIdeas: string[] = [];

        try {
            // 1. Chỉ lấy data từ DB
            const doc = await adminDB.collection('analysis').doc(docId).get();
            
            if (!doc.exists) {
                // Nếu không có trong DB -> Trả về lỗi/rỗng ngay lập tức
                return { 
                    verdict: { status: "No Data", title: "Not Analyzed", description: "Keyword chưa được scan.", color: "gray" }, 
                    apps: [], 
                    seedingTargets: [], 
                    pivotIdeas: [] 
                };
            }

            const d = doc.data();
            
            // 2. Lấy Raw Response (Để parse Seeding Targets hoặc fallback Apps)
            if (d?.raw_response) {
                rawData = typeof d.raw_response === 'string' ? JSON.parse(d.raw_response) : d.raw_response;
            }

            // 3. Lấy Processed Apps (Nếu đã có sẵn do AI làm trước đó)
            if (d?.processed_apps) {
                try {
                    apps = typeof d.processed_apps === 'string' ? JSON.parse(d.processed_apps) : d.processed_apps;
                } catch (e) { apps = []; }
            }

            // 4. Lấy Market Report (Nếu đã có)
            if (d?.market_report) {
                marketReport = d.market_report; // String JSON
            }

            // 5. Local Processing (Chạy đè để lấy Seeding Targets từ Raw Data)
            // Vì Seeding Targets thường không lưu vào processed_apps
            if (rawData && rawData.organic_results) {
                const organic = rawData.organic_results;
                
                // Nếu DB chưa có apps xịn (apps rỗng), thì dùng code chay để tạo list apps tạm
                const useFallbackApps = apps.length === 0;

                organic.forEach((item: any) => {
                    if (!item.link) return;
                    const cat = getDomainCategory(item.domain || '');
                    
                    // Lọc Forum/Seeding
                    if (cat === 'FORUM' || rawData?.discussions_and_forums?.some((d: any) => d.link === item.link)) {
                        seedingTargets.push({ 
                            source: getBrandName(item.domain), 
                            title: item.title, 
                            url: item.link, 
                            meta: extractMetaFromOrganic(item), 
                            isHijackable: true 
                        });
                        return;
                    }

                    // Fallback Apps creation
                    if (useFallbackApps) {
                        const app = createBasicAppItem(item, cat);
                        if (app && cat !== 'NEWS') {
                            apps.push(app);
                        }
                    }
                });

                if (useFallbackApps) {
                    apps = removeDuplicateApps(apps);
                    apps = sortAppsSmart(apps);
                }
            }

            // 6. Lấy Pivot Ideas (Internal Links từ DB)
            pivotIdeas = await getInternalLinks(country, readableKeyword);

        } catch (e) {
            console.error('DB Fetch Error:', e);
            return { verdict: { status: "Error", title: "DB Error", description: "Lỗi truy xuất dữ liệu.", color: "red" }, apps: [], seedingTargets: [], pivotIdeas: [] };
        }

        const verdict = { status: "Well Established", title: "Saturated Market", description: `Many strong brands dominate this niche.`, color: "red" };
        return { verdict, apps, seedingTargets, pivotIdeas, marketReport };
    };

    return { 
        keyword: readableKeyword, 
        slug: rawKeyword, 
        country: country.toUpperCase(),
        metaTitle: `Best ${readableKeyword} Tools (2025)`,
        metaDesc: `Top rated ${readableKeyword} software, templates, and alternatives.`,
        streamed: loadAnalysisData() 
    };
};
