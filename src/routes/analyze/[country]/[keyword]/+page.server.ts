// src/routes/analyze/[country]/[keyword]/+page.server.ts
import type { PageServerLoad } from './$types';
import type { RawApiResponse, AnalysisResult, AppItem, SeedingTarget, Verdict } from '$lib/types';
import { PRIVATE_VALUESERP_API_KEY } from '$env/static/private';
import { COUNTRIES } from '$lib/country_config';
import { DOMAIN_CATEGORIES } from '$lib/constants';
import { adminDB } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { generateMarketReport, extractComparisonData } from '$lib/server/gemini';

// --- 🔥 CONFIG ---
// Bật lại true để test fix lỗi AI, sau đó nhớ tắt đi
const FORCE_AI_REGENERATE = false; 
const ENABLE_DB_UPDATE = true;

// --- HELPERS ---
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

// 🔥 HELPER MỚI: Dọn sạch chuỗi JSON từ AI (Xóa markdown, backticks)
function cleanJsonString(str: string): string {
    if (!str) return '';
    // Xóa ```json ở đầu, ``` ở cuối, và trim khoảng trắng
    return str.replace(/```json/g, '').replace(/```/g, '').trim();
}

// Basic Parser
function createBasicAppItem(item: any, domainCategory: string): AppItem | null {
    if (domainCategory === 'FORUM') return null;

    const snippet = (item.snippet || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const fullText = `${title} ${snippet}`;
    
    // Rich Snippet
    const extensions = item.rich_snippet?.top?.extensions || [];
    const detectedExt = item.rich_snippet?.top?.detected_extensions || {};
    
    let rating: number | undefined;
    let reviewCount: string | undefined;
    let pricing: string = 'Unknown';
    let type: 'app' | 'template' | 'resource' = 'app';

    // Parsing Logic
    extensions.forEach((ext: string) => {
        const e = ext.toLowerCase().trim();
        const rateMatch = e.match(/^(\d(\.\d)?)/); 
        if (rateMatch) {
            const val = parseFloat(rateMatch[1]);
            if (!isNaN(val) && val >= 0 && val <= 5) {
                if (e.includes('(') || e.includes('stars') || e.includes('vote') || e.includes('review') || !e.includes(' ')) {
                    rating = val;
                    const countMatch = e.match(/\(([\d,]+)\)/);
                    if (countMatch) reviewCount = countMatch[1];
                }
            }
        }

        if (e === 'free' || e.includes('free forever')) pricing = 'Free';
        else if (e.includes('free trial')) pricing = 'Free Trial';
        else if (e.includes('price') || e.includes('buy')) pricing = 'Paid';
    });

    if (!rating && detectedExt.rating) rating = detectedExt.rating;
    if (!reviewCount && detectedExt.reviews) reviewCount = detectedExt.reviews;

    // Detect Type
    if (fullText.includes('template') || fullText.includes('theme') || fullText.includes('kit')) {
        type = 'template';
    } else if (fullText.includes('list of') || fullText.includes('top 10') || fullText.includes('best') && !fullText.includes('download')) {
        type = 'resource';
    }

    if (pricing === 'Unknown') {
        if (fullText.includes('open source')) pricing = 'Open Source';
        else if (fullText.includes('free trial')) pricing = 'Free Trial';
        else if (fullText.includes('free forever')) pricing = 'Free';
        else if (fullText.includes('pricing')) pricing = 'Freemium'; 
        else if (fullText.includes('free')) pricing = 'Freemium';
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
        ctaText: 'Visit',
        audience: undefined
    };
}

function analyzeMarket(apps: AppItem[], seedingTargets: SeedingTarget[]): Verdict {
    let opportunityScore = 0;
    if (seedingTargets.length >= 3) opportunityScore += 40;
    const realAppsCount = apps.filter(a => a.type === 'app').length;
    if (realAppsCount < 5) opportunityScore += 20;

    if (opportunityScore >= 40) return { status: "High Demand", title: "Underserved Market", description: `Active discussions found but few dominant tools.`, color: "green" };
    if (opportunityScore >= 15) return { status: "Community Buzz", title: "Active Discussions", description: `Good engagement, users discussing features.`, color: "yellow" };
    return { status: "Well Established", title: "Saturated Market", description: `Many strong brands dominate this niche.`, color: "red" };
}

async function saveRawToFirebase(docId: string, rawData: RawApiResponse, meta: any) {
    try {
        await adminDB.collection('analysis').doc(docId).set({
            ...meta, created_at: Timestamp.now(), raw_response: JSON.stringify(rawData)
        }, { merge: true });
    } catch (e) { console.error('DB Error:', e); }
}

async function updateAnalysisInDB(docId: string, data: { marketReport?: string, processedApps?: AppItem[] }) {
    if (!ENABLE_DB_UPDATE) return;
    try {
        const updateData: any = { updated_at: Timestamp.now() };
        if (data.marketReport) updateData.market_report = data.marketReport;
        if (data.processedApps) {
            updateData.processed_apps = JSON.stringify(data.processedApps);
        }
        await adminDB.collection('analysis').doc(docId).update(updateData);
    } catch (e) { console.error('DB Update Error:', e); }
}

function removeDuplicateApps(apps: AppItem[]): AppItem[] {
    const uniqueMap = new Map<string, AppItem>();

    for (const app of apps) {
        const domainKey = app.domain.toLowerCase().replace(/^www\./, '');
        
        if (!uniqueMap.has(domainKey)) {
            uniqueMap.set(domainKey, app);
        } else {
            const existing = uniqueMap.get(domainKey)!;
            
            // Merge Pricing
            if (existing.pricingModel === 'Unknown' && app.pricingModel !== 'Unknown') {
                existing.pricingModel = app.pricingModel;
            }

            // Merge Features
            const combinedFeatures = new Set([...existing.features, ...app.features]);
            existing.features = Array.from(combinedFeatures).slice(0, 4);
        }
    }
    
    return Array.from(uniqueMap.values());
}

function sortAppsSmart(apps: AppItem[]) {
    return apps.sort((a, b) => {
        const getScore = (item: AppItem) => {
            let score = 0;
            if (item.type === 'app') score += 20000;
            else if (item.type === 'template') score += 10000;
            else score += 0;

            const rating = item.rating || 0;
            score += rating * 200;

            const reviews = item.reviewCount 
                ? parseInt(item.reviewCount.toString().replace(/[^0-9]/g, '')) 
                : 0;
            if (reviews > 0) {
                score += Math.log10(reviews + 1) * 50; 
            }

            if (item.pricingModel && item.pricingModel !== 'Unknown') score += 100;
            return score;
        };
        return getScore(b) - getScore(a);
    });
}

async function getInternalLinks(country: string, currentKeyword: string): Promise<string[]> {
    try {
        const snapshot = await adminDB.collection('analysis')
            .where('country', '==', country.toLowerCase())
            .orderBy('created_at', 'desc')
            .limit(50) 
            .select('keyword')
            .get();

        const links = snapshot.docs
            .map(d => d.data().keyword)
            .filter(k => k && k.toLowerCase() !== currentKeyword.toLowerCase());
        
        return links.sort(() => 0.5 - Math.random()).slice(0, 10);
    } catch (e) {
        console.error('SEO Internal Links Error:', e);
        return []; 
    }
}

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
        let isDataEnriched = false;

        // 1. Cache Check
        try {
            const doc = await adminDB.collection('analysis').doc(docId).get();
            if (doc.exists) {
                const d = doc.data();
                if (d?.raw_response) rawData = JSON.parse(d.raw_response);
                
                if (d?.processed_apps && !FORCE_AI_REGENERATE) {
                    try {
                        const storedApps = d.processed_apps;
                        // Handle cả string lẫn object cũ
                        apps = typeof storedApps === 'string' ? JSON.parse(storedApps) : storedApps;
                        
                        if (Array.isArray(apps) && apps.length > 0) {
                            isDataEnriched = true;
                        }
                    } catch (e) {
                        apps = [];
                        isDataEnriched = false;
                    }
                }
                
                if (d?.market_report && !FORCE_AI_REGENERATE) {
                    // Cố gắng parse thử xem có phải JSON không, nếu không thì coi như chưa có report
                    try {
                        // Nếu là string JSON valid, giữ nguyên để gửi xuống client
                        // Nếu là text rác, client sẽ không parse được -> reset
                        const testParse = JSON.parse(d.market_report);
                        if (testParse && typeof testParse === 'object') {
                            marketReport = d.market_report;
                        }
                    } catch (e) {
                        console.log("Old report invalid, regenerating...");
                        marketReport = ''; // Reset để AI chạy lại
                    }
                }
            }
        } catch (e) {}

        // 2. SERP API Call
        if (!rawData) {
            try {
                const config = COUNTRY_MAP[country.toLowerCase()] || COUNTRY_MAP['us'];
                const url = new URL('[https://api.valueserp.com/search](https://api.valueserp.com/search)');
                url.searchParams.append('api_key', PRIVATE_VALUESERP_API_KEY);
                url.searchParams.append('q', readableKeyword);
                url.searchParams.append('gl', config.gl);
                url.searchParams.append('hl', 'en');
                url.searchParams.append('google_domain', config.google_domain);
                url.searchParams.append('max_page', '2');
                url.searchParams.append('include_answer_box', 'true');
                url.searchParams.append('include_ai_overview', 'true');
                const res = await fetch(url.toString());
                if (!res.ok) throw new Error('API Error');
                rawData = await res.json();
                saveRawToFirebase(docId, rawData!, { keyword: readableKeyword, slug: rawKeyword, country });
            } catch (e) {
                return { verdict: { status: "Error", title: "API Failed", description: "", color: "red" }, apps: [], seedingTargets: [], pivotIdeas: [] };
            }
        }

        // 3. Parsing & Deduping
        if ((!isDataEnriched || FORCE_AI_REGENERATE) && rawData) {
            const organic = rawData.organic_results || [];
            apps = []; 

            organic.forEach(item => {
                if (!item.link) return;
                const cat = getDomainCategory(item.domain || '');
                
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

                const app = createBasicAppItem(item, cat);
                if (app) {
                    if (cat !== 'NEWS') {
                        apps.push(app);
                    }
                }
            });

            apps = removeDuplicateApps(apps);
        }

        pivotIdeas = await getInternalLinks(country, readableKeyword);

        // 4. AI Enrichment & Final Sort
        // Logic: Chạy AI nếu chưa có data, hoặc chưa có report, hoặc force chạy
        if ((!isDataEnriched || !marketReport || FORCE_AI_REGENERATE) && apps.length > 0) {
            try {
                apps = sortAppsSmart(apps);
                const candidates = apps.slice(0, 15);
                const [enrichedApps, rawReport] = await Promise.all([
                    extractComparisonData(readableKeyword, candidates),
                    generateMarketReport(readableKeyword, candidates.filter(a => a.type === 'app'), seedingTargets)
                ]);

                enrichedApps.forEach((item, idx) => {
                    apps[idx] = item; 
                });

                for (let i = 15; i < apps.length; i++) {
                    if (!apps[i].rating) apps[i].type = 'resource';
                }

                // 🔥 Clean JSON String trước khi dùng
                const cleanReport = cleanJsonString(rawReport);
                
                // Chỉ save nếu JSON valid (độ dài > 10 là check sơ bộ)
                if (cleanReport && cleanReport.length > 10) {
                    marketReport = cleanReport;
                }
                
                apps = sortAppsSmart(apps);

                await updateAnalysisInDB(docId, { marketReport, processedApps: apps });
            } catch (e) { console.error('AI Error:', e); }
        }

        if (isDataEnriched) {
            apps = sortAppsSmart(apps);
        }

        const verdict = analyzeMarket(apps, seedingTargets);
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
