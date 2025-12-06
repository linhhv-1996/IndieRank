// src/lib/server/ai.ts
import { GROQ_API_KEY } from '$env/static/private';
import type { AppItem, SeedingTarget } from '$lib/types';

// --- HÀM 1: LÀM SẠCH DATA & VIẾT LẠI MÔ TẢ (CẨN THẬN HƠN) ---
export async function extractComparisonData(keyword: string, apps: AppItem[]): Promise<AppItem[]> {
    if (!GROQ_API_KEY) return apps;

    // Gửi data chi tiết hơn để AI có context chuẩn
    const candidates = apps.slice(0, 15).map((app, index) => ({
        id: index,
        text: `Title: ${app.name} | Original_Snippet: ${app.description} | Price_Detected: ${app.pricingModel} | Real_Rating: ${app.rating || 'N/A'}`
    }));

 const prompt = `
    Role: Senior SaaS Copywriter.
    Task: Rewrite tool descriptions for "${keyword}" to be compelling and consistent.
    Input Data: ${JSON.stringify(candidates)}
    
    STRICT GUIDELINES:
    1. "type": CLASSIFICATION IS CRITICAL.
       - "app": ANY interactive software, SaaS, online utility, converter, calculator, or downloadable program. If users "use" it to do something, it is an "app".
       - "template": Only static files, themes, notions templates, UI kits.
       - "resource": Only blogs, articles, listicles ("Top 10..."), wikis.
       - TIP: If it has a Pricing plan, it is 99% an "app".

    2. "pricing": ["Free", "Freemium", "Paid", "Open Source", "Free Trial"].
    
    3. "description": WRITE A BRAND NEW DESCRIPTION (Critical).
       - TARGET LENGTH: 130 to 160 characters. (Do not output less than 140 chars).
       - STYLE: Professional, benefit-driven, punchy.
       - TEMPLATE: [Action Verb] [Key Benefit] + [Secondary Feature/Proof] + [No-friction Statement].
       - EXAMPLE INPUT: "Free jpg to pdf converter online."
       - EXAMPLE OUTPUT: "Instantly convert JPG images to professional PDFs without quality loss. Works securely in your browser with no registration or watermarks required."
       - IF INPUT IS SHORT: You MUST expand it by inferring common features implied by the title/niche (e.g., "User-friendly interface", "Cross-platform support", "Secure processing").
    
    4. "rating": 
       - PRIORITY 1: Use "Real_Rating" provided in input.
       - PRIORITY 2: If "Real_Rating" is "N/A", estimate based on known market reputation.
       - CONSTRAINT: Do NOT generate random high ratings (like 4.8, 4.9) for unknown tools.

    5. "specific_features": Extract 3 distinct short features (e.g. "No Signup", "4K Export", "AI Tools").
    
    Output JSON Format: { "items": [{ "id": 0, "type": "...", "pricing": "...", "description": "...", "rating": 4.5, "specific_features": [...] }, ...] }
    `;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.2, // Giảm temperature để AI bớt "phiêu", trả kết quả chính xác hơn
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
                // Logic: Ưu tiên rating thật từ Google (app.rating), nếu ko có mới lấy của AI
                rating: app.rating || info.rating, 
                audience: info.audience,
                platforms: info.platforms
            };
        });
    } catch (e) {
        console.error('AI Extract Error:', e);
        return apps;
    }
}

// --- HÀM 2: TẠO BÁO CÁO (FIX LỖI BỊA RATING) ---
export async function generateMarketReport(
    keyword: string, 
    apps: AppItem[], 
    targets: SeedingTarget[]
): Promise<string> {
    if (!GROQ_API_KEY) return '';

    // Chuẩn bị data sạch cho AI, kèm Rating thật
    const topApps = apps
        .filter(a => a.type === 'app')
        .slice(0, 5)
        .map(a => `Name: "${a.name}", Price: ${a.pricingModel}, Real_Rating: ${a.rating || 'N/A'}, Info: "${a.description}"`)
        .join('\n');

    const prompt = `
    Role: Objective Software Reviewer.
    Topic: Buying advice for "${keyword}".
    
    Candidates Data:
    ${topApps}
    
    Task: Generate a JSON market report.
    
    1. "editor_choice": Select the best all-around tool.
       - "name": Exact name from candidates.
       - "summary": A compelling 2-sentence reason why it's the winner based on "Info".
       - "best_for": Target user (e.g. "Teams", "Beginners").
       - "rating": MUST USE "Real_Rating" from data. If "N/A", provide a conservative estimate (e.g. 4.5). DO NOT HALLUCINATE.
       - "pros": [Array of 3 short pros].
    
    2. "best_value": Select the best free/cheap option.
       - "name": ...
       - "summary": ...
       - "price_tag": e.g. "Free Forever" or "$5/mo".
    
    3. "pro_tip": A specific, non-obvious tip for choosing software in this niche.
       - "title": ...
       - "content": ...
    
    Output JSON Only.
    `;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.2, // Giữ thấp để output ổn định
                response_format: { type: "json_object" }
            })
        });
        const data = await response.json();
        console.log(data);
        return data.choices?.[0]?.message?.content || '';
    } catch (e) { console.log(e); }
}
