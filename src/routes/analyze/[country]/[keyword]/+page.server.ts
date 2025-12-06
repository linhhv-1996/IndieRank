import { adminDB } from '$lib/server/firebase';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { AppItem } from '$lib/types';


function unslugify(slug: string) {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}


// --- HÀM 1: LỌC TRÙNG LẶP (Giữ sạch danh sách) ---
function removeDuplicateApps(apps: AppItem[]): AppItem[] {
    const uniqueMap = new Map<string, AppItem>();
    
    for (const app of apps) {
        // Chuẩn hoá domain để làm key (bỏ www., chữ thường)
        // Ví dụ: www.Asana.com -> asana.com
        if (!app.domain) continue;
        const domainKey = app.domain.toLowerCase().replace(/^www\./, '').trim();
        
        // Nếu chưa có domain này thì thêm vào
        if (!uniqueMap.has(domainKey)) {
            uniqueMap.set(domainKey, app);
        }
        // Nếu đã có rồi thì bỏ qua (Giữ thằng đầu tiên gặp, thường là kết quả SEO tốt hơn)
    }
    
    return Array.from(uniqueMap.values());
}

// --- HÀM SORT: Sắp xếp lại trật tự thế giới ---
function sortApps(apps: AppItem[]): AppItem[] {
    return apps.sort((a, b) => {
        // 1. ƯU TIÊN RATING (Quan trọng nhất)
        // Rating cao lên đầu. Rating = 0 hoặc undefined cho xuống đáy xã hội.
        const rA = a.rating || 0;
        const rB = b.rating || 0;
        if (rA !== rB) return rB - rA; // Giảm dần

        // 2. ƯU TIÊN REVIEW COUNT (Độ uy tín)
        // Nếu cùng điểm rating, thằng nào nhiều review hơn thì thắng
        const getReviews = (str?: string) => {
            if (!str) return 0;
            // Chuẩn hoá: "1.2k" -> 1200, "1M" -> 1000000, "1,200" -> 1200
            const s = str.toString().toLowerCase().replace(/,/g, '').trim();
            if (s.includes('k')) return parseFloat(s) * 1000;
            if (s.includes('m')) return parseFloat(s) * 1000000;
            return parseFloat(s) || 0;
        };
        const revA = getReviews(a.reviewCount);
        const revB = getReviews(b.reviewCount);
        if (revA !== revB) return revB - revA; // Giảm dần

        // 3. ƯU TIÊN DATA ĐẦY ĐỦ (Pricing)
        // Thằng nào có giá rõ ràng thì ưu tiên hơn thằng Unknown
        const pA = (a.pricingModel && a.pricingModel !== 'Unknown') ? 1 : 0;
        const pB = (b.pricingModel && b.pricingModel !== 'Unknown') ? 1 : 0;
        return pB - pA;
    });
}


async function getRelatedKeywords(country: string, currentKeyword: string): Promise<string[]> {
    const kw = unslugify(currentKeyword);

    try {
        // Lấy 20 bài mới nhất cùng quốc gia để làm Related
        // Lưu ý: Đảm bảo trong Firestore document có lưu field 'country' và 'keyword'
        const snapshot = await adminDB.collection('analysis')
            .where('country', '==', country.toLowerCase()) // Hoặc toUpperCase tuỳ cách mày lưu
            .orderBy('created_at', 'desc') // Sắp xếp theo ngày tạo mới nhất
            .limit(20) 
            .select('keyword') // Chỉ lấy field keyword cho nhẹ
            .get();

        const related = snapshot.docs
            .map(doc => doc.data().keyword)
            .filter(k => k && k.toLowerCase() !== kw.toLowerCase());

        return related.slice(0, 12); 

    } catch (e) {
        console.error('Get Related Keywords Error:', e);
        return []; // Lỗi thì trả về rỗng, ko chết trang
    }
}


export const load: PageServerLoad = async ({ params }) => {
    const { country, keyword } = params;
    const docId = `${keyword}`; 

    try {
        const docRef = adminDB.collection('analysis').doc(docId);
        const [docSnap, relatedKeywords] = await Promise.all([
            docRef.get(),
            getRelatedKeywords(country, keyword)
        ]);

        if (!docSnap.exists) {
            throw error(404, 'Not analyzed yet.');
        }

        const data = docSnap.data();

        // Helper parse JSON an toàn
        const parse = (str: any) => {
            if (typeof str === 'string') {
                try { return JSON.parse(str); } catch { return []; }
            }
            return str || [];
        };

        // Lấy đúng field name đã chuẩn hoá
        let apps = parse(data?.processed_apps);
        const seedingTargets = parse(data?.seeding_targets);
        const alternatives = parse(data?.alternatives);
        const marketReport = typeof data?.market_report === 'string' ? data.market_report : JSON.stringify(data?.market_report || {});

        apps = removeDuplicateApps(apps);
        apps = sortApps(apps);

        return {
            keyword: unslugify(keyword),
            country: country.toUpperCase(),
            apps,
            seedingTargets,
            alternatives,
            marketReport,
            pivotIdeas: relatedKeywords
        };

    } catch (e: any) {
        console.error('Load Error:', e);
        throw error(404, 'Error loading data');
    }
};
