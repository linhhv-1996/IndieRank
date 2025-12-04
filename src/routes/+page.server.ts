import { adminDB } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    try {
        const snapshot = await adminDB.collection('analysis')
            .orderBy('created_at', 'desc')
            .limit(15)
            .select('keyword', 'slug', 'country')
            .get();

        const trendingSearches = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                keyword: data.keyword,
                slug: data.slug,
                country: data.country || 'us'
            };
        });

        return { trendingSearches };

    } catch (error) {
        console.error('Homepage Load Error:', error);
        return { trendingSearches: [] };
    }
};
