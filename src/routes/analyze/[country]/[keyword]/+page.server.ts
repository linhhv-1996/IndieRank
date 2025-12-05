// src/routes/analyze/[country]/[keyword]/+page.server.ts
import type { PageServerLoad } from './$types';
import type { RawApiResponse, AnalysisResult, AppItem, SeedingTarget, Verdict } from '$lib/types';
import { PRIVATE_VALUESERP_API_KEY } from '$env/static/private';
import { COUNTRIES } from '$lib/country_config';
import { DOMAIN_CATEGORIES } from '$lib/constants';
import { adminDB } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { generateMarketReport, extractComparisonData } from '$lib/server/ai';

// --- 🔥 CONFIG ---
const FORCE_AI_REGENERATE = true; 
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

// Basic Parser: Trích xuất thô để chuẩn bị cho AI
function createBasicAppItem(item: any, domainCategory: string): AppItem | null {
    if (domainCategory === 'FORUM') return null;

    const snippet = (item.snippet || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const fullText = `${title} ${snippet}`;
    
    // Rich Snippet là nguồn tin cậy nhất
    const extensions = item.rich_snippet?.top?.extensions || [];
    const detectedExt = item.rich_snippet?.top?.detected_extensions || {};
    
    let rating: number | undefined;
    let reviewCount: string | undefined;
    let pricing: string = 'Unknown';
    let type: 'app' | 'template' | 'resource' = 'app';

    // 1. Quét Extensions để lấy Rating & Pricing chuẩn
    extensions.forEach((ext: string) => {
        const e = ext.toLowerCase().trim();
        
        // Regex bắt Rating: "4.9(3,551)" hoặc "4.5 stars"
        // Match số 0.0-5.0 ở đầu chuỗi
        const rateMatch = e.match(/^(\d(\.\d)?)/); 
        if (rateMatch) {
            const val = parseFloat(rateMatch[1]);
            // Logic chặt: Rating phải <= 5 và đi kèm ngữ cảnh (ngoặc, stars...)
            if (!isNaN(val) && val >= 0 && val <= 5) {
                if (e.includes('(') || e.includes('stars') || e.includes('vote') || e.includes('review') || !e.includes(' ')) {
                    rating = val;
                    // Lấy số review trong ngoặc "(3,551)"
                    const countMatch = e.match(/\(([\d,]+)\)/);
                    if (countMatch) reviewCount = countMatch[1];
                }
            }
        }

        if (e === 'free' || e.includes('free forever')) pricing = 'Free';
        else if (e.includes('free trial')) pricing = 'Free Trial';
        else if (e.includes('price') || e.includes('buy')) pricing = 'Paid';
    });

    // Fallback nếu rich snippet thiếu
    if (!rating && detectedExt.rating) rating = detectedExt.rating;
    if (!reviewCount && detectedExt.reviews) reviewCount = detectedExt.reviews;

    // Detect Type sơ bộ
    if (fullText.includes('template') || fullText.includes('theme') || fullText.includes('kit')) {
        type = 'template';
    } else if (fullText.includes('list of') || fullText.includes('top 10')) {
        type = 'resource';
    }

    // Detect Pricing sơ bộ từ text
    if (pricing === 'Unknown') {
        if (fullText.includes('open source')) pricing = 'Open Source';
        else if (fullText.includes('free trial')) pricing = 'Free Trial';
        else if (fullText.includes('free forever')) pricing = 'Free';
        else if (fullText.includes('pricing')) pricing = 'Freemium'; 
        else if (fullText.includes('free')) pricing = 'Freemium';
    }

    // Lấy feature sơ bộ
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
        reviewCount, // Lưu reviewCount để sort sau này
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

async function getKeywordIdeas(apiKeywordIdeas: string[], countryCode: string, readableKeyword: string): Promise<string[]> {
    try {
        const linksSnap = await adminDB.collection('analysis').where('country', '==', countryCode).orderBy('created_at', 'desc').limit(20).select('keyword').get();
        const dbKeywords = linksSnap.docs.map(d => d.data().keyword).filter(k => k && k !== readableKeyword);
        if (dbKeywords.length > 0) return dbKeywords.sort(() => 0.5 - Math.random()).slice(0, 10);
    } catch (e) { /* Ignore */ }
    return apiKeywordIdeas;
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
        
        // 🔥 FIX QUAN TRỌNG: JSON.stringify rồi JSON.parse để loại bỏ hoàn toàn 'undefined'
        // Firestore sẽ báo lỗi nếu object chứa value là undefined. Cách này clean sạch nhất.
        if (data.processedApps) {
            updateData.processed_apps = JSON.parse(JSON.stringify(data.processedApps));
        }

        await adminDB.collection('analysis').doc(docId).update(updateData);
        console.log('✅ AI Data Saved');
    } catch (e) { console.error('DB Update Error:', e); }
}

// 🔥 LOGIC SORT MỚI: App > Rating > Review Count
function sortAppsSmart(apps: AppItem[]) {
    return apps.sort((a, b) => {
        // 1. App lên trước Resource
        if (a.type === 'app' && b.type !== 'app') return -1;
        if (a.type !== 'app' && b.type === 'app') return 1;

        // 2. Rating cao lên trước (0 so với undefined thì 0 thắng)
        const rA = a.rating || 0;
        const rB = b.rating || 0;
        if (rA !== rB) return rB - rA; // Lớn lên đầu

        // 3. Nếu Rating bằng nhau, Review Count cao lên trước
        const getCount = (str?: string) => str ? parseInt(str.replace(/,/g, '')) : 0;
        const cA = getCount(a.reviewCount);
        const cB = getCount(b.reviewCount);
        return cB - cA; // Lớn lên đầu
    });
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

        // 1. Cache
        try {
            const doc = await adminDB.collection('analysis').doc(docId).get();
            if (doc.exists) {
                const d = doc.data();
                if (d?.raw_response) rawData = JSON.parse(d.raw_response);
                if (d?.processed_apps && !FORCE_AI_REGENERATE) {
                    try { apps = JSON.parse(d.processed_apps); isDataEnriched = true; } catch (e) {}
                }
                if (d?.market_report && !FORCE_AI_REGENERATE) marketReport = d.market_report;
            }
        } catch (e) {}

        // 2. SERP API
        if (!rawData) {
            try {
                const config = COUNTRY_MAP[country.toLowerCase()] || COUNTRY_MAP['us'];
                const url = new URL('https://api.valueserp.com/search');
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

        // 3. Basic Parse
        if ((!isDataEnriched || FORCE_AI_REGENERATE) && rawData) {
            const organic = rawData.organic_results || [];
            const addedUrls = new Set();
            apps = [];

            organic.forEach(item => {
                if (!item.link || addedUrls.has(item.link)) return;
                const cat = getDomainCategory(item.domain || '');
                if (cat === 'FORUM' || rawData?.discussions_and_forums?.some((d: any) => d.link === item.link)) {
                    seedingTargets.push({ source: getBrandName(item.domain), title: item.title, url: item.link, meta: extractMetaFromOrganic(item), isHijackable: true });
                    addedUrls.add(item.link);
                    return;
                }
                const app = createBasicAppItem(item, cat);
                if (app) {
                    if (cat !== 'NEWS') {
                        apps.push(app);
                        addedUrls.add(item.link);
                    }
                }
            });
        }

        if (rawData?.related_searches) pivotIdeas = rawData.related_searches.map(s => s.query).slice(0, 8);

        // 4. AI Enrichment
        if ((!isDataEnriched || FORCE_AI_REGENERATE) && apps.length > 0) {
            try {
                // Sort sơ bộ
                apps = sortAppsSmart(apps);

                // Chỉ gửi top 15 cho AI
                const candidates = apps.slice(0, 15);
                const [enrichedApps, report] = await Promise.all([
                    extractComparisonData(readableKeyword, candidates),
                    generateMarketReport(readableKeyword, candidates.filter(a => a.type === 'app'), seedingTargets)
                ]);

                enrichedApps.forEach((item, idx) => {
                    apps[idx] = item; 
                });

                // Set type resource cho phần đuôi
                for (let i = 15; i < apps.length; i++) apps[i].type = 'resource';

                marketReport = report;
                
                // Sort lại lần cuối
                apps = sortAppsSmart(apps);

                await updateAnalysisInDB(docId, { marketReport, processedApps: apps });
            } catch (e) { console.error('AI Error:', e); }
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
