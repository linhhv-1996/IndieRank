// src/lib/server/ai.ts
import { GROQ_API_KEY } from '$env/static/private';
import type { AppItem, SeedingTarget } from '$lib/types';

// --- HÀM 1: LÀM SẠCH DATA & VIẾT LẠI MÔ TẢ ---
export async function extractComparisonData(keyword: string, apps: AppItem[]): Promise<AppItem[]> {
    if (!GROQ_API_KEY) return apps;

    const candidates = apps.slice(0, 15).map((app, index) => ({
        id: index,
        // 🔥 QUAN TRỌNG: Gửi cả Rating/Review đã parse được cho AI biết
        text: `Title: ${app.name} | Snippet: ${app.description} | Initial_Price: ${app.pricingModel} | Rating_Found: ${app.rating || 'N/A'}`
    }));

    const prompt = `
    Role: Expert SaaS Copywriter.
    Task: Analyze tools for "${keyword}" and rewrite metadata for a comparison grid.
    Input: ${JSON.stringify(candidates)}
    
    Instructions:
    Return a JSON array (key: "items") with these fields:
    
    1. "type": "app" (software), "template", or "resource".
    2. "pricing": One of ["Free", "Freemium", "Paid", "Open Source", "Free Trial"].
    
    3. "description": WRITE A BRAND NEW DESCRIPTION (Critical).
       - TARGET LENGTH: 130 to 160 characters. (Do not output less than 120 chars).
       - STYLE: Professional, benefit-driven, punchy.
       - TEMPLATE: [Action Verb] [Key Benefit] + [Secondary Feature/Proof] + [No-friction Statement].
       - EXAMPLE INPUT: "Free jpg to pdf converter online."
       - EXAMPLE OUTPUT: "Instantly convert JPG images to professional PDFs without quality loss. Works securely in your browser with no registration or watermarks required."
       - IF INPUT IS SHORT: You MUST expand it by inferring common features like "No signup", "Secure encryption", "Works on Mac/PC", "Fast processing".
    
    4. "audience": e.g. "Freelancers", "Enterprises", "Students".
    5. "platforms": e.g. ["Web", "iOS", "Android"].
    6. "specific_features": 3 distinct features (e.g. "Batch Processing", "OCR").
    7. "rating": Estimate 0-5 if valid, else null.
    
    Output JSON Format: { "items": [...] }
    `;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.3, 
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
        const items = content.items || [];

        return apps.map((app, index) => {
            const info = items.find((i: any) => i.id === index);
            if (!info) return app;

            return {
                ...app,
                type: info.type || 'app',
                description: info.description || app.description, 
                pricingModel: info.pricing || app.pricingModel,
                features: info.specific_features?.length > 0 ? info.specific_features : app.features, 
                rating: info.rating || app.rating, // Ưu tiên AI confirm lại
                audience: info.audience,
                platforms: info.platforms
            };
        });
    } catch (e) {
        console.error('AI Extract Error:', e);
        return apps;
    }
}

// --- HÀM 2: TẠO BÁO CÁO (Giữ nguyên logic cũ) ---
export async function generateMarketReport(
    keyword: string, 
    apps: AppItem[], 
    targets: SeedingTarget[]
): Promise<string> {
    if (!GROQ_API_KEY) return '';
    const topApps = apps.filter(a => a.type === 'app').slice(0, 5).map(a => `${a.name} (${a.pricingModel})`).join(', ');
    const prompt = `
    Role: Brutally Honest Software Reviewer.
    Topic: Buying advice for "${keyword}".
    Top Candidates: ${topApps}.
    Task: Generate a JSON report.
    1. "editor_choice": { "name", "summary", "best_for", "rating", "pros" (array), "con" }
    2. "best_value": { "name", "summary", "price_tag", "best_for" }
    3. "pro_tip": { "title", "content" }
    Output JSON Only.
    `;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.2,
                response_format: { type: "json_object" }
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (e) { return ''; }
}