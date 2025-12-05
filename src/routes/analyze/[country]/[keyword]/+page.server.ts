// src/routes/analyze/[country]/[keyword]/+page.server.ts
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

// Phân loại Domain
function getDomainCategory(domain: string): keyof typeof DOMAIN_CATEGORIES | 'UNKNOWN' {
    const d = domain.toLowerCase();
    for (const [category, keywords] of Object.entries(DOMAIN_CATEGORIES)) {
        if (keywords.some(k => d.includes(k))) {
            return category as keyof typeof DOMAIN_CATEGORIES;
        }
    }
    return 'UNKNOWN';
}

// --- LOGIC MỚI: XỬ LÝ DATA SERP THỰC TẾ (ROBUST) ---
function normalizeAppItem(item: any, domainCategory: string): AppItem | null {
    if (domainCategory === 'FORUM') return null;

    // 1. AN TOÀN LÀ TRÊN HẾT: Xử lý trường hợp không có rich_snippet
    const extensions = item.rich_snippet?.top?.extensions || [];
    const extensionText = Array.isArray(extensions) ? extensions.join(' ') : '';
    
    // Gộp text an toàn. Nếu snippet null thì dùng chuỗi rỗng.
    const fullText = `${item.title || ''} ${item.snippet || ''} ${extensionText}`.toLowerCase();

    // 2. Phân tích Features & Pricing (Logic vét cạn)
    const features: string[] = [];
    let pricing: 'Free' | 'Freemium' | 'Paid' | 'Unknown' = 'Unknown';

    // -- Bắt giá (Mở rộng từ khóa) --
    if (
        fullText.includes('free account') || 
        fullText.includes('start for free') || 
        fullText.includes('sign up free') ||
        fullText.includes('free trial') || // Thường trial là paid/freemium
        fullText.includes('0$')
    ) {
        pricing = 'Freemium';
    } else if (
        fullText.includes('pricing') || 
        fullText.includes('buy') || 
        fullText.includes('subscribe') ||
        fullText.includes('plan') // VD: "Pro plan"
    ) {
        pricing = 'Paid';
    } else if (fullText.includes('free') || fullText.includes('no credit card')) {
        // Check kỹ hơn: Nếu chỉ có chữ "free" đơn độc thì khả năng cao là Free thật
        pricing = 'Free';
    }

    // -- Bắt tính năng (Dựa trên data thực tế & keyword phổ biến) --
    // General Tech
    if (fullText.includes('ai ') || fullText.includes('ai-powered') || fullText.includes('gpt')) features.push('AI Powered');
    if (fullText.includes('no code') || fullText.includes('drag and drop') || fullText.includes('drag-and-drop')) features.push('No Code');
    if (fullText.includes('open source') || fullText.includes('github')) features.push('Open Source');
    if (fullText.includes('unlimited')) features.push('Unlimited');
    
    // Platform
    if (fullText.includes('ios') || fullText.includes('iphone')) features.push('iOS');
    if (fullText.includes('android')) features.push('Android');
    if (fullText.includes('mac') || fullText.includes('macos')) features.push('macOS');
    if (fullText.includes('windows')) features.push('Windows');

    // Niche Specific (Ví dụ cho Survey/Form - Có thể mở rộng)
    if (fullText.includes('template')) features.push('Templates');
    if (fullText.includes('quiz')) features.push('Quiz Maker');
    if (fullText.includes('poll')) features.push('Polls');

    // Audience
    let audience: string | undefined;
    if (fullText.includes('team') || fullText.includes('enterprise') || fullText.includes('business')) {
        audience = '🏢 For Teams';
    } else if (fullText.includes('personal') || fullText.includes('freelance') || fullText.includes('solo')) {
        audience = '👤 For Solo';
    }

    // 3. Phân loại App/Resource (Quan trọng để lọc rác)
    // Nếu tiêu đề/snippet chứa động từ hành động hoặc danh từ công cụ
    const isAppSignal = [
        'maker', 'builder', 'creator', 'generator', 'platform', 'tool', 'software', 'app',
        'create', 'build', 'make', 'generate', 'design', 'download'
    ].some(k => fullText.includes(k));

    // Loại trừ báo chí/tin tức nếu không phải là review
    const isNews = domainCategory === 'NEWS';
    
    // Logic quyết định Type
    let type: 'app' | 'template' | 'resource' = 'resource';
    
    if (fullText.includes('template') || fullText.includes('theme') || fullText.includes('kit')) {
        type = 'template';
    } else if (isAppSignal && !isNews) {
        type = 'app';
    }

    // CTA Text
    let ctaText = 'Visit';
    if (type === 'app') ctaText = 'Get App';
    else if (type === 'template') ctaText = 'View Template';

    // Rating (Cố gắng lấy từ rich snippet extension nếu có dạng "4.5 (200)")
    let rating: number | undefined;
    let reviewCount: string | undefined;
    
    // Regex tìm rating trong extension text (VD: "4.5/5" hoặc "4.8")
    const ratingMatch = extensionText.match(/(\d(\.\d)?)\s*(\/|\(|\sstars)/);
    if (ratingMatch) {
        const val = parseFloat(ratingMatch[1]);
        if (!isNaN(val) && val <= 5) rating = val;
    }

    if (rating && rating >= 4.5) features.unshift('🔥 Top Rated');

    return {
        name: getBrandName(item.domain), 
        domain: item.domain || '',
        url: item.link || '',
        description: item.snippet || '', // Fallback nếu snippet rỗng
        type,
        pricingModel: pricing,
        features: features.slice(0, 4), // Lấy tối đa 4 tags
        rating,
        reviewCount,
        ctaText,
        audience
    };
}

function analyzeMarket(apps: AppItem[], seedingTargets: SeedingTarget[]): Verdict {
    let opportunityScore = 0;
    if (seedingTargets.length >= 3) opportunityScore += 40;
    else if (seedingTargets.length >= 1) opportunityScore += 15;

    const realAppsCount = apps.filter(a => a.type === 'app').length;
    if (realAppsCount < 5) opportunityScore += 20;

    if (opportunityScore >= 40) {
        return {
            status: "High Demand",
            title: "Underserved Market",
            description: `<b>High Interest, Low Supply.</b> Active discussions found but few dominant tools.`,
            color: "green"
        };
    }
    if (opportunityScore >= 15) {
        return {
            status: "Community Buzz",
            title: "Active Discussions",
            description: `<b>Good Engagement.</b> Tools exist, but users are still discussing features.`,
            color: "yellow"
        };
    }
    return {
        status: "Well Established",
        title: "Saturated Market",
        description: `<b>Many Options.</b> Big brands dominate this niche.`,
        color: "red"
    };
}

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
        await adminDB.collection('analysis').doc(docId).set(record);
        console.log('✅ Saved raw data to DB:', docId);
    } catch (error) {
        console.error('🔥 Firebase Save Error:', error);
    }
}

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
        metaDesc: `Discover the top-rated tools for ${readableKeyword}.`,
    };

    const loadAnalysisData = async (): Promise<AnalysisResult> => {
        const config = COUNTRY_MAP[countryCode] || COUNTRY_MAP['us'];
        let rawData: RawApiResponse | null = null;

        try {
            const docRef = adminDB.collection('analysis').doc(docId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const data = docSnap.data();
                if (data?.raw_response) rawData = JSON.parse(data.raw_response);
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
                saveRawToFirebase(docId, rawData!, { keyword: readableKeyword, slug: rawKeyword, country: countryCode });
            } catch (error) {
                return { verdict: { status: "Error", title: "Error", description: "Fetch failed", color: "red" }, apps: [], seedingTargets: [], pivotIdeas: [] };
            }
        }

        const organicResults = rawData?.organic_results || [];
        const apps: AppItem[] = [];
        const seedingTargets: SeedingTarget[] = [];
        const addedUrls = new Set<string>();

        organicResults.forEach(item => {
            if (!item.link || addedUrls.has(item.link)) return;
            const domainCategory = getDomainCategory(item.domain || '');
            const brandName = getBrandName(item.domain || '');

            if (domainCategory === 'FORUM' || rawData?.discussions_and_forums?.some((d: any) => d.link === item.link)) {
                 seedingTargets.push({
                    source: brandName,
                    title: item.title,
                    url: item.link,
                    meta: extractMetaFromOrganic(item),
                    isHijackable: true
                });
                addedUrls.add(item.link);
                return;
            }

            const appItem = normalizeAppItem(item, domainCategory);
            if (appItem) {
                if (domainCategory === 'NEWS' && appItem.type !== 'app') return;
                apps.push(appItem);
                addedUrls.add(item.link);
            }
        });

        if (rawData?.discussions_and_forums) {
            rawData.discussions_and_forums.forEach(d => {
                if (d.link && !addedUrls.has(d.link)) {
                    seedingTargets.push({
                        source: d.source?.source_title || 'Forum',
                        title: d.discussion_title || 'Discussion',
                        url: d.link,
                        meta: d.source?.comments_count || 'Active Thread',
                        isHijackable: true
                    });
                    addedUrls.add(d.link);
                }
            });
        }

        // --- RELATED SEARCHES (GIỮ NGUYÊN NHƯ CŨ) ---
        let rawIdeas: string[] = [];
        if (rawData?.related_searches) rawIdeas.push(...rawData.related_searches.map(s => s.query));
        if (rawData?.related_questions) rawIdeas.push(...rawData.related_questions.map(q => q.question));
        
        const apiPivotIdeas = [...new Set(rawIdeas)].filter(str => str && str.length < 70 && str.length > 5).slice(0, 8);
        const pivotIdeas = await getKeywordIdeas(apiPivotIdeas, countryCode, readableKeyword);

        // Sort: App có rating/features lên đầu
        // apps.sort((a, b) => {
        //     const scoreA = (a.type === 'app' ? 20 : 0) + (a.rating || 0) + (a.features.length * 2);
        //     const scoreB = (b.type === 'app' ? 20 : 0) + (b.rating || 0) + (b.features.length * 2);
        //     return scoreB - scoreA;
        // });
        apps.sort((a, b) => {
            // 1. Rating (Hệ số 10.000): Ưu tiên tuyệt đối số 1.
            // Có rating là bố, không bàn cãi.
            const ratingA = (a.rating || 0) * 10000;
            const ratingB = (b.rating || 0) * 10000;

            // 2. Độ giàu thông tin (Richness) - QUAN TRỌNG NHÌ
            // Đếm số lượng feature tìm được (Free, AI, No Code...).
            // Mỗi feature = 100 điểm. Max 4 feature = 400 điểm.
            // Logic cũ: feature có 10đ -> Quá thấp.
            const featA = (a.features?.length || 0) * 100;
            const featB = (b.features?.length || 0) * 100;

            // 3. Loại (Type) - QUAN TRỌNG BA
            // App chỉ được cộng 50 điểm thôi (ít hơn 1 feature).
            // Nghĩa là: Resource có 1 feature (100đ) vẫn hơn App rỗng (50đ).
            const typeA = a.type === 'app' ? 50 : 0;
            const typeB = b.type === 'app' ? 50 : 0;

            // 4. Độ dài mô tả (Description) - Tie-breaker
            // Thằng nào mô tả dài hơn chút thì ưu tiên nhẹ (tránh mấy thằng rỗng tuếch)
            const descA = (a.description || '').length > 20 ? 10 : 0;
            const descB = (b.description || '').length > 20 ? 10 : 0;

            const scoreA = ratingA + featA + typeA + descA;
            const scoreB = ratingB + featB + typeB + descB;

            return scoreB - scoreA; // Giảm dần
        });

        const verdict = analyzeMarket(apps, seedingTargets);

        return { verdict, apps, seedingTargets, pivotIdeas };
    };

    return { ...metaData, streamed: loadAnalysisData() };
};
