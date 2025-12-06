// src/routes/admin/manual/+page.server.ts
import { adminDB } from '$lib/server/firebase';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    generate_prompts: async ({ request }) => {
        const formData = await request.formData();
        const keyword = formData.get('keyword') as string;
        const country = formData.get('country') as string || 'us';

        if (!keyword) return fail(400, { missing: true });

        try {
            // 1. Tạo ID từ keyword (giống logic luồng chính)
            // Lưu ý: Logic slugify này phải khớp với lúc bạn lưu. 
            // Nếu bạn dùng thư viện slugify, hãy import nó. Ở đây mình dùng regex đơn giản.
               
            
            const docId = `${keyword}`;

            console.log(docId);

            // 2. Lấy dữ liệu RAW từ Firestore
            const docRef = adminDB.collection('analysis').doc(docId);
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                return fail(404, { error: `Không tìm thấy dữ liệu cho keyword "${keyword}" (${country}) trong DB. Hãy chạy Scan trước.` });
            }

            const data = docSnap.data();
            let rawData;

            // Parse raw_response (vì nó thường được lưu dạng chuỗi JSON)
            try {
                rawData = typeof data?.raw_response === 'string' 
                    ? JSON.parse(data.raw_response) 
                    : data?.raw_response;
            } catch (e) {
                return fail(500, { error: 'Lỗi parse raw_response trong DB.' });
            }

            if (!rawData || !rawData.organic_results) {
                return fail(400, { error: 'Data trong DB bị lỗi hoặc thiếu organic_results.' });
            }

            // 3. Chuẩn bị Context cho Prompt (Lấy Top 20 kết quả)
            const organicResults = rawData.organic_results.slice(0, 20);
            const contextData = organicResults.map((item: any, index: number) => {
                return `[Result #${index + 1}]
Title: ${item.title}
URL: ${item.link}
Snippet: ${item.snippet}
Price Hint: ${item.rich_snippet?.top?.extensions?.join(', ') || 'N/A'}
Review Hint: ${item.rich_snippet?.top?.detected_extensions?.rating || 'N/A'} stars`;
            }).join('\n-------------------\n');

            // --- PROMPT 1: Processed Apps ---
            const promptApps = `
Role: Data Analyst & Software Classifier.
Task: Extract and refine a list of software/tools from the Google Search Results below.

SOURCE DATA:
${contextData}

INSTRUCTIONS:
1. Identify items that are "Apps", "SaaS", "Software", or "Templates". Ignore general blogs, news, or dictionaries.
2. For each item, refine the data into a JSON object.
3. Output ONLY a JSON Array under the key "processed_apps".

JSON STRUCTURE PER ITEM:
{
  "name": "Brand Name (Clean)",
  "domain": "rootdomain.com",
  "url": "Direct link from source",
  "description": "A compelling, benefit-driven description (120-150 chars). Rewrite the snippet.",
  "type": "app" | "template" | "resource",
  "pricingModel": "Free" | "Freemium" | "Paid" | "Free Trial" (Infer from snippets/price hints),
  "features": ["Feature 1", "Feature 2", "Feature 3"] (Max 3, short),
  "rating": 4.5 (Number. Use "Review Hint" if available, else estimate based on reputation. No N/A),
  "reviewCount": "1,000+" (String. Estimate or use "Review Hint"),
  "ctaText": "Visit"
}

OUTPUT FORMAT:
{
  "processed_apps": [ ... ]
}
`;

            // --- PROMPT 2: Market Report ---
            // Mình dùng luôn raw data để bạn đỡ phải copy output của prompt 1 sang prompt 2.
            const promptReport = `
Role: Senior Software Reviewer.
Task: Write a concise market analysis report for "${keyword}" based on the Search Results below.

SOURCE DATA:
${contextData}

INSTRUCTIONS:
1. Analyze the top tools found in the data.
2. Select the "Editor's Choice" (Best overall) and "Best Value" (Best free/cheap).
3. Provide a "Pro Tip" for choosing in this niche.
4. Output ONLY a JSON Object under the key "market_report".

JSON STRUCTURE:
{
    {
      "editor_choice": {
        "name": "Exact Brand Name",
        "summary": "Why it is the winner (2 sentences).",
        "best_for": "Target Audience (e.g. Teams, Freelancers)",
        "rating": 4.8,
        "pros": ["Pro 1", "Pro 2", "Pro 3"],
        "con": "One main drawback"
      }
    },
    {
      "best_value": {
        "name": "Exact Brand Name",
        "summary": "Why it is the best value option.",
        "price_tag": "Free / $Price",
        "best_for": "Target Audience"
      }
    },
    {
      "pro_tip": {
        "title": "Short Tip Title",
        "content": "Actionable advice for buyers in this specific market."
      }
    }
}
`;



            return { 
                success: true, 
                keyword,
                country,
                promptApps, 
                promptReport 
            };

        } catch (error: any) {
            console.error(error);
            return fail(500, { error: error.message });
        }
    }
};
