import type { PageServerLoad } from './$types';
import type { RawApiResponse, AnalysisResult, SerpItem, SeedingTarget, Verdict } from '$lib/types';
import { PRIVATE_VALUESERP_API_KEY } from '$env/static/private';
import { COUNTRIES } from '$lib/country_config';


const COUNTRY_MAP = COUNTRIES.reduce((acc, curr) => {
    // Giả sử host language (hl) là tiếng Anh. Dùng 'vi' cho Việt Nam, 'zh-TW' cho Taiwan (ví dụ)
    let hl = 'en';
    if (curr.gl === 'vn') hl = 'vi';
    else if (curr.gl === 'tw') hl = 'zh-TW';

    acc[curr.gl] = { gl: curr.gl, hl: hl, google_domain: curr.domain };
    return acc;
}, {} as Record<string, { gl: string; hl: string; google_domain: string }>);


// ==========================================
// 2. HELPER FUNCTIONS (Normalization Logic)
// ==========================================

function unslugify(slug: string) {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}


// Hàm helper để làm sạch domain (Bỏ www., bỏ đuôi .com)
function getBrandName(input: string): string {
    console.log(input);

    if (!input) return '';

    let urlLike = input.trim();

    // Nếu không có protocol thì tự thêm vào cho chắc
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(urlLike)) {
        urlLike = 'https://' + urlLike;
    }

    let hostname = '';

    try {
        hostname = new URL(urlLike).hostname.toLowerCase();
    } catch {
        // Fallback: tự cắt tay
        hostname = urlLike
            .replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '') // bỏ protocol
            .split('/')[0]                                 // lấy tới trước dấu /
            .toLowerCase();
    }

    // Bỏ mấy prefix hay gặp
    hostname = hostname.replace(/^(www|m|app)\./, '');

    // Nếu là IP hoặc rỗng thì trả 'site'
    if (!hostname || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
        return 'site';
    }

    const parts = hostname.split('.').filter(Boolean);
    if (!parts.length) return 'site';

    let brandSlug: string;

    if (parts.length === 1) {
        // ví dụ: "localhost"
        brandSlug = parts[0];
    } else {
        const last = parts[parts.length - 1];       // com / vn / uk ...
        const secondLast = parts[parts.length - 2]; // wise / co / canva ...
        const secondLevelTlds = ['co', 'com', 'org', 'net', 'gov', 'ac', 'edu'];

        // Xử lý kiểu domain "domain.co.uk"
        if (last.length === 2 && secondLevelTlds.includes(secondLast)) {
            // ... -> sub.domain.co.uk => lấy 'domain'
            brandSlug = parts[parts.length - 3] || secondLast;
        } else {
            // bình thường: invoice-generator.com, wise.com, canva.com
            brandSlug = secondLast;
        }
    }

    // Nếu muốn giữ dạng "invoice-generator" thì return thẳng:
    return (brandSlug || 'site').charAt(0).toUpperCase() + (brandSlug || 'site').slice(1);;
}


// Phân loại Domain
function categorizeDomain(domain: string, title: string): { type: string, isWeak: boolean } {
    const d = domain.toLowerCase();
    const t = title.toLowerCase();

    // Weak Spots (Mục tiêu tấn công)
    if (d.includes('reddit') || d.includes('quora') || d.includes('indiehackers') || d.includes('ycombinator')) {
        return { type: 'UGC / Forum', isWeak: true };
    }

    // Review Sites (Khó nhằn)
    if (d.includes('g2.com') || d.includes('capterra') || d.includes('trustradius') || d.includes('softwareadvice')) {
        return { type: 'Review Site', isWeak: false };
    }

    // Listicle Blogs (Cạnh tranh nội dung)
    if (t.includes('best') || t.includes('top') || t.includes('vs') || t.includes('review')) {
        return { type: 'Listicle', isWeak: false };
    }

    // Product Pages (Đối thủ trực tiếp)
    return { type: 'Product', isWeak: false };
}

// Trích xuất Meta info từ Organic Result (Ví dụ: "27 answers" từ rich snippet)
function extractMetaFromOrganic(item: any): string {
    const displayed = item.displayed_link?.toLowerCase() || '';

    // ƯU TIÊN 1: Displayed Link (Chứa "ago", "comment", "answer"...)
    // VD: "20+ comments · 1 year ago" -> Lấy luôn
    if (displayed.includes('ago') ||
        displayed.includes('comment') ||
        displayed.includes('answer') ||
        displayed.includes('post')) {
        return item.displayed_link; // Trả về nguyên gốc (giữ hoa thường)
    }

    // ƯU TIÊN 2: Rich Snippet Extensions
    // VD: ["27 answers", "May 15, 2025"]
    const extensions = item.rich_snippet?.top?.extensions || [];
    const commentExt = extensions.find((e: string) =>
        e.toLowerCase().includes('answer') ||
        e.toLowerCase().includes('comment')
    );
    if (commentExt) return commentExt;

    // FALLBACK: Chỉ hiện Rank
    return `Rank #${item.position}`;
}


// ==========================================
// NEW HELPER: Logic phân tích thị trường nâng cao
// ==========================================
function analyzeMarket(serpItems: SerpItem[], seedingTargets: SeedingTarget[]): Verdict {
    const weakItems = serpItems.filter(i => i.isWeakSpot);
    const weakCount = weakItems.length;

    // Tìm vị trí của Weak Spot cao nhất (nếu có)
    const topWeakRank = weakItems.length > 0 ? parseInt(weakItems[0].rank) : 99;

    // Lấy tên 3 đối thủ mạnh nhất (Top 3 không phải weak spot) để đưa vào text cho nguy hiểm
    const giants = serpItems
        .filter(i => !i.isWeakSpot && parseInt(i.rank) <= 3)
        .map(i => getBrandName(i.url))
        .slice(0, 2)
        .join(', ');

    // --- CASE 1: GOLD MINE (Forum chiếm Top 3 hoặc số lượng nhiều) ---
    if (topWeakRank <= 3 || weakCount >= 3) {
        return {
            status: "SEO Goldmine",
            title: "EXCELLENT CHANCE",
            description: `Google is starving for user content here. With <b>${weakCount} forums</b> in Top 10 (highest at #${topWeakRank}), you can rank a blog or tool easily by answering user intent better than a forum thread.`,
            color: "green"
        };
    }

    // --- CASE 2: SEEDING OPPORTUNITY (Forum nằm ở trang 1 nhưng không cao) ---
    // (Đây chính là case "Invoice Generator" của bạn: Reddit top 8)
    if (weakCount > 0) {
        let weakName = "Forum";
        let weakRankStr = "Unknown";
        let weakUrl = "";

        if (weakItems.length > 0) {
            // FIX: Lấy tên brand chuẩn từ URL của Weak Spot cao nhất
            weakUrl = weakItems[0].url;
            weakName = getBrandName(weakUrl); 
            weakRankStr = weakItems[0].rank;
        } else if (seedingTargets.length > 0) {
            // Fallback lấy từ Discussions Box
            weakName = seedingTargets[0].source;
            weakRankStr = "Discussions";
        }
        
        // Viết hoa chữ cái đầu
        const weakNamePretty = weakName.charAt(0).toUpperCase() + weakName.slice(1);
        
        return {
            status: "Seeding Gap",
            title: "HIJACK TRAFFIC",
            description: `Hard to rank SEO against giants like <b>${giants}</b>, but users are actively looking for honest opinions on <b>${weakNamePretty}</b> (Rank #${weakRankStr}). <br><b>Strategy:</b> Don't fight the giants. Hijack the discussion at #${weakRankStr}.`,
            color: "yellow"
        };
    }

    // --- CASE 3: HARD (Toàn hàng khủng) ---
    return {
        status: "Saturated",
        title: "COMPETITIVE WALL",
        description: `This SERP is locked down by big players like <b>${giants}</b>. No user discussions found in Top 10. <br><b>Advice:</b> Pivot to a more specific long-tail keyword (e.g., "for designers" or "open source").`,
        color: "red"
    };
}


// ==========================================
// 3. MAIN LOAD FUNCTION
// ==========================================
export const load: PageServerLoad = async ({ params }) => {
    const countryCode = params.country.toLowerCase();
    const rawKeyword = params.keyword;
    const readableKeyword = unslugify(rawKeyword);

    // META DATA (Static)
    const metaData = {
        keyword: readableKeyword,
        slug: rawKeyword,
        country: countryCode.toUpperCase(),
        metaTitle: `${readableKeyword} Analysis - NicheRadar`,
        metaDesc: `Analysis for ${readableKeyword}`,
    };

    // STREAMING FUNCTION
    const loadAnalysisData = async (): Promise<AnalysisResult> => {

        const config = COUNTRY_MAP[countryCode] || COUNTRY_MAP['us'];
        const url = new URL('https://api.valueserp.com/search');
        url.searchParams.append('api_key', PRIVATE_VALUESERP_API_KEY);
        url.searchParams.append('q', readableKeyword);
        url.searchParams.append('gl', config.gl); // Geo Location (Quốc gia)
        url.searchParams.append('hl', 'en'); // Ngôn ngữ
        url.searchParams.append('google_domain', config.google_domain);
        url.searchParams.append('include_answer_box', 'true');
        url.searchParams.append('include_ai_overview', 'true'); // Lấy cả AI Overview nếu cần dùng sau này
        url.searchParams.append('num', '10'); // Lấy Top 10

        try {
            // B. Gọi API thật
            const res = await fetch(url.toString());

            if (!res.ok) {
                throw new Error(`ValueSERP API Error: ${res.statusText}`);
            }

            const apiData: RawApiResponse = await res.json();

            // Check nếu request fail từ phía API provider
            if (apiData.request_info && apiData.request_info.success === false) {
                throw new Error(apiData.request_info.message || 'API request failed');
            }

            // C. Xử lý dữ liệu (Normalization)

            // --- 1. Process SERP List ---
            const organicResults = apiData.organic_results || [];
            const serpItems: SerpItem[] = organicResults.map(item => {
                const { type, isWeak } = categorizeDomain(item.domain, item.title);
                return {
                    rank: item.position < 10 ? `0${item.position}` : `${item.position}`,
                    domain: item.domain,
                    title: item.title,
                    url: item.link,
                    snippet: item.snippet,
                    tags: [type],
                    isWeakSpot: isWeak
                };
            });

            // --- 2. Process Seeding Targets ---
            const seedingTargets: SeedingTarget[] = [];
            const addedUrls = new Set<string>(); // Để tránh trùng lặp

            // Nguồn 1: Discussions & Forums Box (Của Google trả về riêng)
            if (apiData.discussions_and_forums) {
                apiData.discussions_and_forums.forEach(d => {
                    const metaParts = [];
                    if (d.source?.comments_count) metaParts.push(d.source.comments_count);
                    if (d.source?.time) metaParts.push(d.source.time);

                    seedingTargets.push({
                        source: d.source?.source_title || 'Forum',
                        title: d.discussion_title,
                        url: d.link,
                        meta: metaParts.join(' • ') || 'Active Thread',
                        isHijackable: true
                    });
                    addedUrls.add(d.link);
                });
            }

            // Nguồn 2: Quét Organic Results tìm Reddit/Quora (Nếu chưa có trong list trên)
            organicResults.forEach(item => {
                const { isWeak } = categorizeDomain(item.domain, item.title);

                // Chỉ lấy nếu là Weak Spot và chưa được thêm vào list
                if (isWeak && !addedUrls.has(item.link)) {
                    let sourceName = 'Forum';
                    if (item.domain.includes('reddit')) sourceName = 'Reddit';
                    else if (item.domain.includes('quora')) sourceName = 'Quora';
                    else if (item.domain.includes('ycombinator')) sourceName = 'Hacker News';

                    seedingTargets.push({
                        source: sourceName,
                        title: item.title,
                        url: item.link,
                        meta: extractMetaFromOrganic(item), // Hàm helper lấy số comment/ngày tháng
                        isHijackable: true
                    });
                    addedUrls.add(item.link);
                }
            });

            // --- 3. Process Verdict ---
            const verdict = analyzeMarket(serpItems, seedingTargets);

            // --- 4. Pivot Ideas ---
            const pivotIdeas = apiData.related_searches?.map(s => s.query) || [];

            return { verdict, serpItems, seedingTargets, pivotIdeas };

        } catch (error) {
            console.error("Analysis Error:", error);
            // Trả về dữ liệu rỗng hoặc lỗi để UI hiển thị thông báo
            throw error;
        }
    };

    return {
        ...metaData,
        streamed: loadAnalysisData()
    };
};
