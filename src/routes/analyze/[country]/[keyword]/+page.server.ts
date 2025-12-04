import type { PageServerLoad } from './$types';
import type { RawApiResponse, AnalysisResult, AppItem, SeedingTarget, Verdict } from '$lib/types';
import { PRIVATE_VALUESERP_API_KEY } from '$env/static/private';
import { COUNTRIES } from '$lib/country_config';
import { DOMAIN_CATEGORIES, PRODUCT_INTENT } from '$lib/constants';
import { adminDB } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';



const COUNTRY_MAP = COUNTRIES.reduce((acc, curr) => {
    let hl = 'en';
    if (curr.gl === 'vn') hl = 'vi';
    else if (curr.gl === 'tw') hl = 'zh-TW';
    acc[curr.gl] = { gl: curr.gl, hl: hl, google_domain: curr.domain };
    return acc;
}, {} as Record<string, { gl: string; hl: string; google_domain: string }>);

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
    if (displayed.includes('ago') || displayed.includes('comment') || displayed.includes('answer') || displayed.startsWith('http')) {
        return item.displayed_link;
    }
    const extensions = item.rich_snippet?.top?.extensions || [];
    const commentExt = extensions.find((e: string) =>
        e.toLowerCase().includes('answer') || e.toLowerCase().includes('comment')
    );
    return commentExt || `Rank #${item.position}`;
}

// ==========================================
// 2. CORE CLASSIFICATION LOGIC (CLEAN & OPTIMIZED)
// ==========================================

// Phân loại Domain dựa trên Config trong constants.ts
function getDomainCategory(domain: string): keyof typeof DOMAIN_CATEGORIES | 'UNKNOWN' {
    const d = domain.toLowerCase();
    for (const [category, keywords] of Object.entries(DOMAIN_CATEGORIES)) {
        if (keywords.some(k => d.includes(k))) {
            return category as keyof typeof DOMAIN_CATEGORIES;
        }
    }
    return 'UNKNOWN';
}

// Nhận diện loại sản phẩm (App/Template) từ ngữ cảnh
function identifyProductType(text: string): { type: 'app' | 'template', cta: string } | null {
    const t = text.toLowerCase();

    // 1. Ưu tiên check Template (cụ thể hơn)
    if (PRODUCT_INTENT.TEMPLATE.some(k => t.includes(k))) {
        return { type: 'template', cta: 'View Template' };
    }

    // 2. Check App / Software
    if (PRODUCT_INTENT.APP.some(k => t.includes(k))) {
        return { type: 'app', cta: 'Get App' };
    }

    return null;
}

// ==========================================
// 3. MARKET ANALYSIS LOGIC (USER-CENTRIC)
// ==========================================

function analyzeMarket(apps: AppItem[], seedingTargets: SeedingTarget[]): Verdict {
    let opportunityScore = 0;

    // Logic tính điểm: Nhiều thảo luận -> Nhu cầu cao
    if (seedingTargets.length >= 3) opportunityScore += 40;
    else if (seedingTargets.length >= 1) opportunityScore += 15;

    // Logic cung cầu: Ít App xịn -> Cơ hội cao
    const realAppsCount = apps.filter(a => a.type === 'app').length;
    if (realAppsCount < 5) opportunityScore += 20;

    // VERDICT: Ngôn ngữ thân thiện với End-user
    if (opportunityScore >= 40) {
        return {
            status: "High Demand",
            title: "Underserved Market",
            description: `<b>High Interest, Low Supply.</b> Search results are filled with questions and forums. Users are actively looking for a better solution but haven't found a dominant tool yet.`,
            color: "green"
        };
    }

    if (opportunityScore >= 15) {
        return {
            status: "Community Buzz",
            title: "Active Discussions",
            description: `<b>Good Engagement.</b> Established tools exist, but users are still actively discussing features and problems on Reddit/Quora. <i>A sign of an engaged user base.</i>`,
            color: "yellow"
        };
    }

    return {
        status: "Well Established",
        title: "Saturated Market",
        description: `<b>Many Options Available.</b> The results are dominated by big brands and popular tools. Users have plenty of high-quality choices.`,
        color: "red"
    };
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// 4. MAIN LOAD FUNCTION
// ==========================================

export const load: PageServerLoad = async ({ params }) => {
    const countryCode = params.country.toLowerCase();
    const rawKeyword = params.keyword;
    const readableKeyword = unslugify(rawKeyword);
    const docId = `${countryCode}_${rawKeyword}`;

    const metaData = {
        keyword: readableKeyword,
        slug: rawKeyword,
        country: countryCode.toUpperCase(),
        metaTitle: `Best ${readableKeyword} Tools & Resources (2025)`,
        metaDesc: `Discover the top-rated tools for ${readableKeyword}. Curated list of apps, templates, and community discussions.`,
    };



    const loadAnalysisData = async (): Promise<AnalysisResult> => {
        const config = COUNTRY_MAP[countryCode] || COUNTRY_MAP['us'];
        let rawData: RawApiResponse | null = null;

        try {
            const docRef = adminDB.collection('analysis').doc(docId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                const data = docSnap.data();
                if (data?.raw_response) {
                    rawData = typeof data.raw_response === 'string'
                        ? JSON.parse(data.raw_response)
                        : data.raw_response;
                    console.log('⚡ HIT CACHE:', docId);
                }
            }
        } catch (e) { console.error('DB Error:', e); }

        if (!rawData) {
            try {
                const url = new URL('https://api.valueserp.com/search');
                url.searchParams.append('api_key', PRIVATE_VALUESERP_API_KEY);
                url.searchParams.append('q', readableKeyword);
                url.searchParams.append('gl', config.gl);
                url.searchParams.append('hl', 'en');
                url.searchParams.append('google_domain', config.google_domain);
                url.searchParams.append('include_answer_box', 'true');
                url.searchParams.append('include_ai_overview', 'true');
                url.searchParams.append('max_page', '2');
                const res = await fetch(url.toString());
                if (!res.ok) throw new Error(`API Error`);
                rawData = await res.json();

                saveRawToFirebase(docId, rawData!, {
                    keyword: readableKeyword,
                    slug: rawKeyword,
                    country: countryCode
                });

            } catch (error) {
                console.error("Analysis Error:", error);
                return {
                    verdict: { status: "Error", title: "Data Unavailable", description: "Could not fetch data.", color: "red" },
                    apps: [],
                    seedingTargets: [],
                    pivotIdeas: []
                };
            }
        }

        const organicResults = rawData?.organic_results || [];

        const apps: AppItem[] = [];
        const seedingTargets: SeedingTarget[] = [];
        const addedUrls = new Set<string>();

        // --- BƯỚC 1: QUÉT & PHÂN LOẠI THÔNG MINH ---
        organicResults.forEach(item => {
            if (!item.link || addedUrls.has(item.link)) return;

            const domain = item.domain || '';
            const title = item.title || '';
            const snippet = item.snippet || '';
            const fullText = `${title} ${snippet}`;
            const brandName = getBrandName(domain);

            // 1. Xác định Category của Domain
            const category = getDomainCategory(domain);

            // 2. Xử lý theo từng nhóm
            switch (category) {
                // A. Nhóm Community / Seeding -> Vào cột phải (Community Discussions)
                case 'FORUM':
                case 'PUBLIC_DOC': // Doc public cũng là nguồn thảo luận/tham khảo tốt
                    seedingTargets.push({
                        source: brandName,
                        title: title,
                        url: item.link,
                        meta: extractMetaFromOrganic(item),
                        isHijackable: true // Mặc định nhóm này là "Hot Topic"
                    });
                    addedUrls.add(item.link);
                    break;

                // B. Nhóm Rác / Báo chí / Review Site to -> Bỏ qua (Để tránh loãng AppGrid)
                case 'NEWS':
                case 'REVIEW':
                case 'TECH':
                    // Chỉ dùng Tech nếu muốn target dev sâu, còn user thường thì bỏ qua
                    break;

                // C. Nhóm Unknown (Web/Blog/SaaS) -> Phân tích xem có phải App/Template không
                default:
                    const productInfo = identifyProductType(fullText);

                    if (productInfo) {
                        apps.push({
                            name: brandName,
                            domain: domain,
                            url: item.link,
                            description: snippet,
                            tags: [productInfo.type === 'app' ? 'Software' : 'Template'],
                            type: productInfo.type,
                            ctaText: productInfo.cta
                        });
                        addedUrls.add(item.link);
                    }
                    break;
            }
        });

        // --- BƯỚC 2: FALLBACK STRATEGY (LẤY RESOURCE) ---
        // Nếu tìm được quá ít App (dưới 3), lấy thêm các bài Blog/Guide tốt nhất từ nhóm Unknown
        if (apps.length < 3) {
            organicResults.forEach(item => {
                if (apps.length >= 10 || addedUrls.has(item.link)) return;

                const category = getDomainCategory(item.domain || '');

                // Chỉ lấy những trang KHÔNG PHẢI Báo chí/Review/Forum (đã lọc ở trên)
                if (category === 'UNKNOWN') {
                    apps.push({
                        name: getBrandName(item.domain || ''),
                        domain: item.domain || '',
                        url: item.link,
                        description: item.snippet || '',
                        tags: ['Guide'],
                        type: 'resource', // Đánh dấu là Resource/Guide
                        ctaText: 'Read Guide'
                    });
                    addedUrls.add(item.link);
                }
            });
        }

        // --- BƯỚC 3: LẤY THÊM TỪ 'Discussions' BOX (Google Feature) ---
        if (rawData?.discussions_and_forums) {
            rawData.discussions_and_forums.forEach(d => {
                if (d.link && !addedUrls.has(d.link)) {
                    seedingTargets.push({
                        source: d.source?.source_title || 'Forum',
                        title: d.discussion_title || 'Discussion',
                        url: d.link,
                        meta: 'Active Thread',
                        isHijackable: true
                    });
                    addedUrls.add(d.link);
                }
            });
        }

        // --- BƯỚC 4: PIVOT IDEAS (Related Searches) ---
        let rawIdeas: string[] = [];
        if (rawData?.related_searches) {
            rawIdeas.push(...rawData.related_searches.map(s => s.query));
        }
        if (rawData?.related_questions) {
            rawIdeas.push(...rawData.related_questions.map(q => q.question));
        }

        const apiPivotIdeas = [...new Set(rawIdeas)]
            .filter(str => str && str.length < 70 && str.length > 5)
            .slice(0, 8);

        const pivotIdeas = await getKeywordIdeas(apiPivotIdeas, countryCode, readableKeyword);

        // Tính toán Verdict cuối cùng
        const verdict = analyzeMarket(apps, seedingTargets);

        return { verdict, apps, seedingTargets, pivotIdeas };

    };

    return {
        ...metaData,
        streamed: loadAnalysisData()
    };
};

async function getKeywordIdeas(apiKeywordIdeas: string[], countryCode: string, readableKeyword: string): Promise<string[]> {
    const linksSnap = await adminDB.collection('analysis')
        .where('country', '==', countryCode)
        .orderBy('created_at', 'desc')
        .limit(20)
        .select('keyword')
        .get();

    const dbKeywords = linksSnap.docs
        .map(d => d.data().keyword)
        .filter(k => k && k !== readableKeyword);

    if (dbKeywords.length > 0) {
        return dbKeywords.sort(() => 0.5 - Math.random()).slice(0, 10);
    }
    return apiKeywordIdeas;
}


async function saveRawToFirebase(docId: string, rawData: RawApiResponse, meta: { keyword: string, slug: string, country: string }) {
    try {
        const record = {
            keyword: meta.keyword,
            slug: meta.slug,
            country: meta.country,
            created_at: Timestamp.now(),
            raw_response: JSON.stringify(rawData)
        };

        // Dùng .set() để ghi đè (hoặc tạo mới) document theo ID định sẵn
        await adminDB.collection('analysis').doc(docId).set(record);
        
        console.log('✅ Saved raw data to DB:', docId);
    } catch (error) {
        // Chỉ log lỗi, không throw để tránh làm chết luồng trả về cho user
        console.error('🔥 Firebase Save Error:', error);
    }
}

