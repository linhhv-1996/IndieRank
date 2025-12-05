// src/routes/analyze/[country]/[keyword]/+page.server.ts
import type { PageServerLoad } from './$types';
import type { RawApiResponse, AnalysisResult, AppItem, SeedingTarget, Verdict } from '$lib/types';
import { PRIVATE_VALUESERP_API_KEY } from '$env/static/private';
import { COUNTRIES } from '$lib/country_config';
import { DOMAIN_CATEGORIES } from '$lib/constants';
import { adminDB } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { generateMarketReport } from '$lib/server/ai';

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

function getDomainCategory(domain: string): keyof typeof DOMAIN_CATEGORIES | 'UNKNOWN' {
    const d = domain.toLowerCase();
    for (const [category, keywords] of Object.entries(DOMAIN_CATEGORIES)) {
        if (keywords.some(k => d.includes(k))) {
            return category as keyof typeof DOMAIN_CATEGORIES;
        }
    }
    return 'UNKNOWN';
}

function normalizeAppItem(item: any, domainCategory: string): AppItem | null {
    if (domainCategory === 'FORUM') return null;

    const extensions = item.rich_snippet?.top?.extensions || [];
    const extensionText = Array.isArray(extensions) ? extensions.join(' ') : '';
    const fullText = `${item.title || ''} ${item.snippet || ''} ${extensionText}`.toLowerCase();

    const features: string[] = [];
    let pricing: 'Free' | 'Freemium' | 'Paid' | 'Unknown' = 'Unknown';

    if (fullText.includes('free account') || fullText.includes('start for free') || fullText.includes('sign up free') || fullText.includes('free trial') || fullText.includes('0$')) {
        pricing = 'Freemium';
    } else if (fullText.includes('pricing') || fullText.includes('buy') || fullText.includes('subscribe') || fullText.includes('plan')) {
        pricing = 'Paid';
    } else if (fullText.includes('free') || fullText.includes('no credit card')) {
        pricing = 'Free';
    }

    if (fullText.includes('ai ') || fullText.includes('ai-powered') || fullText.includes('gpt')) features.push('AI Powered');
    if (fullText.includes('no code') || fullText.includes('drag and drop')) features.push('No Code');
    if (fullText.includes('open source') || fullText.includes('github')) features.push('Open Source');
    if (fullText.includes('unlimited')) features.push('Unlimited');
    if (fullText.includes('ios') || fullText.includes('iphone')) features.push('iOS');
    if (fullText.includes('android')) features.push('Android');
    if (fullText.includes('mac') || fullText.includes('macos')) features.push('macOS');
    if (fullText.includes('windows')) features.push('Windows');
    if (fullText.includes('template')) features.push('Templates');

    let audience: string | undefined;
    if (fullText.includes('team') || fullText.includes('enterprise') || fullText.includes('business')) {
        audience = '🏢 For Teams';
    } else if (fullText.includes('personal') || fullText.includes('freelance') || fullText.includes('solo')) {
        audience = '👤 For Solo';
    }

    const isAppSignal = [
        'maker', 'builder', 'creator', 'generator', 'platform', 'tool', 'software', 'app',
        'create', 'build', 'make', 'generate', 'design', 'download'
    ].some(k => fullText.includes(k));

    const isNews = domainCategory === 'NEWS';
    
    let type: 'app' | 'template' | 'resource' = 'resource';
    if (fullText.includes('template') || fullText.includes('theme') || fullText.includes('kit')) {
        type = 'template';
    } else if (isAppSignal && !isNews) {
        type = 'app';
    }

    let ctaText = 'Visit';
    if (type === 'app') ctaText = 'Get App';
    else if (type === 'template') ctaText = 'View Template';

    let rating: number | undefined;
    let reviewCount: string | undefined;
    
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
        description: item.snippet || '', 
        type,
        pricingModel: pricing,
        features: features.slice(0, 4),
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
    try {
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
    } catch (e) {
        // Fallback nếu query lỗi (ví dụ chưa index)
    }
    return apiKeywordIdeas;
}

// Hàm này chỉ lưu Raw SERP response (chạy lần đầu)
async function saveRawToFirebase(docId: string, rawData: RawApiResponse, meta: { keyword: string, slug: string, country: string }) {
    try {
        const record = {
            keyword: meta.keyword,
            slug: meta.slug,
            country: meta.country,
            created_at: Timestamp.now(),
            raw_response: JSON.stringify(rawData)
        };
        await adminDB.collection('analysis').doc(docId).set(record, { merge: true });
        console.log('✅ Saved Raw SERP Data:', docId);
    } catch (error) {
        console.error('🔥 Firebase Save Raw Error:', error);
    }
}

// Hàm này UPDATE document để lưu thêm marketReport (chạy sau khi có AI)
async function saveReportToFirebase(docId: string, report: string) {
    try {
        await adminDB.collection('analysis').doc(docId).update({
            market_report: report, // <-- Lưu cái này vào để lần sau lấy ra dùng
            updated_at: Timestamp.now()
        });
        console.log('✅ Cached AI Report to DB:', docId);
    } catch (error) {
        console.error('🔥 Firebase Save Report Error:', error);
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
        let marketReport = ''; // Biến chứa report (lấy từ DB hoặc tạo mới)

        // 1. Kiểm tra Cache trong DB
        try {
            const docRef = adminDB.collection('analysis').doc(docId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const data = docSnap.data();
                // Lấy Raw Data cũ
                if (data?.raw_response) rawData = JSON.parse(data.raw_response);
                // Lấy Report đã cache (quan trọng!)
                if (data?.market_report) marketReport = data.market_report;
            }
        } catch (e) { console.error('DB Cache Error:', e); }

        // 2. Nếu không có Raw Data -> Gọi SERP API
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
                url.searchParams.append('include_videos', 'true');
                url.searchParams.append('max_page', '2');
                
                const res = await fetch(url.toString());
                if (!res.ok) throw new Error(`API Error`);
                
                rawData = await res.json();
                // Lưu raw data ngay lập tức
                saveRawToFirebase(docId, rawData!, { keyword: readableKeyword, slug: rawKeyword, country: countryCode });
            } catch (error) {
                return { verdict: { status: "Error", title: "Error", description: "Fetch failed", color: "red" }, apps: [], seedingTargets: [], pivotIdeas: [], marketReport: '' };
            }
        }

        // 3. Xử lý dữ liệu (Extract Apps, Forum, Video...)
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

        if (rawData?.inline_videos) {
            rawData.inline_videos.forEach(v => {
                if (v.link && !addedUrls.has(v.link)) {
                    const src = (v.source || '').toLowerCase();
                    if (src.includes('reddit') || src.includes('youtube') || src.includes('tiktok')) {
                        seedingTargets.push({
                            source: v.source || 'Video',
                            title: v.title,
                            url: v.link,
                            meta: v.length ? `Video • ${v.length}` : 'Video',
                            isHijackable: true
                        });
                        addedUrls.add(v.link);
                    }
                }
            });
        }

        // 4. Pivot Ideas
        let rawIdeas: string[] = [];
        if (rawData?.related_searches) rawIdeas.push(...rawData.related_searches.map(s => s.query));
        if (rawData?.related_questions) rawIdeas.push(...rawData.related_questions.map(q => q.question));
        const apiPivotIdeas = [...new Set(rawIdeas)].filter(str => str && str.length < 70 && str.length > 5).slice(0, 8);
        const pivotIdeas = await getKeywordIdeas(apiPivotIdeas, countryCode, readableKeyword);

        // 5. Sorting
        apps.sort((a, b) => {
            const ratingA = (a.rating || 0) * 10000;
            const ratingB = (b.rating || 0) * 10000;
            const featA = (a.features?.length || 0) * 100;
            const featB = (b.features?.length || 0) * 100;
            const typeA = a.type === 'app' ? 50 : 0;
            const typeB = b.type === 'app' ? 50 : 0;
            const descA = (a.description || '').length > 20 ? 10 : 0;
            const descB = (b.description || '').length > 20 ? 10 : 0;
            const scoreA = ratingA + featA + typeA + descA;
            const scoreB = ratingB + featB + typeB + descB;
            return scoreB - scoreA; 
        });

        const verdict = analyzeMarket(apps, seedingTargets);

        // 6. LOGIC AI & CACHING (Quan trọng)
        // Nếu trong DB chưa có report thì mới gọi AI
        if (!marketReport && apps.length > 0) {
            // Gọi AI
            marketReport = await generateMarketReport(readableKeyword, apps, seedingTargets);
            
            // Nếu tạo thành công thì lưu ngay vào DB để lần sau không phải gọi nữa
            if (marketReport) {
                await saveReportToFirebase(docId, marketReport);
            }
        }

        return { verdict, apps, seedingTargets, pivotIdeas, marketReport };
    };

    return { ...metaData, streamed: loadAnalysisData() };
};
