// src/routes/niches/+page.server.ts
import { adminDB } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    try {
        // Lấy danh sách tất cả (Limit 500 cho an toàn)
        const snapshot = await adminDB.collection('analysis')
            .orderBy('created_at', 'desc')
            .limit(500)
            .select('keyword', 'slug', 'country')
            .get();

        const niches = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                keyword: data.keyword,
                slug: data.slug,
                country: data.country || 'us'
            };
        });

        return { niches };

    } catch (error) {
        console.error('Directory Load Error:', error);
        return { niches: [] };
    }
};
