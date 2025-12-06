// src/lib/server/gemini.ts
import { GEMINI_API_KEY } from '$env/static/private';
import type { AppItem, SeedingTarget } from '$lib/types';
import { GoogleGenAI } from "@google/genai";

// Khởi tạo Google GenAI Client (SDK mới nhất)
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Helper để gọi Gemini và parse JSON an toàn
async function callGemini(prompt: string, temp: number = 0.2) {
    if (!GEMINI_API_KEY) return null;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash', // Model tối ưu cho tốc độ/giá
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                temperature: temp,
                responseMimeType: "application/json" // JSON Mode xịn của 1.5 Flash
            }
        });

        const text = result.text;
        return text ? JSON.parse(text) : null;

    } catch (e) {
        console.error('Gemini GenAI SDK Error:', e);
        return null;
    }
}

// --- HÀM 1: LÀM SẠCH DATA & VIẾT LẠI MÔ TẢ ---
export async function extractComparisonData(keyword: string, apps: AppItem[]): Promise<AppItem[]> {
    if (!GEMINI_API_KEY) return apps;

    const candidates = apps.slice(0, 15).map((app, index) => ({
        id: index,
        text: `Title: ${app.name} | Original_Snippet: ${app.description} | Price_Detected: ${app.pricingModel} | Real_Rating: ${app.rating || 'N/A'}`
    }));

    const prompt = `
    Role: Senior SaaS Analyst.
    Task: Classify and refine tool metadata for: "${keyword}".
    Input Data: ${JSON.stringify(candidates)}
    
    STRICT GUIDELINES:
    1. "type": CLASSIFICATION IS CRITICAL.
       - "app": Interactive software, SaaS, online utilities, downloadables.
       - "template": Static files, notion templates, UI kits.
       - "resource": Blogs, listicles ("Top 10..."), wikis, news.
       - TIP: If it has Pricing, it is almost certainly an "app".
    
    2. "pricing": ["Free", "Freemium", "Paid", "Open Source", "Free Trial"]. Use "Price_Detected" as hint.
    
    3. "description": Write a benefit-driven description (120-160 chars).
       - BASE ON: "Original_Snippet" and Title.
       - IF SNIPPET IS SHORT: Infer common features for this tool type to expand the text.
       - Style: Professional, concise.
    
    4. "rating": 
       - PRIORITY 1: Use "Real_Rating".
       - PRIORITY 2: If "Real_Rating" is "N/A", estimate conservatively based on reputation.
       - CONSTRAINT: Do NOT spam 5.0 ratings.

    5. "specific_features": Extract 3 distinct features.
    
    Output JSON Format: { "items": [{ "id": 0, "type": "...", "pricing": "...", "description": "...", "rating": 4.5, "specific_features": [...] }, ...] }
    `;

    const result = await callGemini(prompt, 0.2);

    console.log(result);
    
    if (!result || !result.items) return apps;

    return apps.map((app, index) => {
        const info = result.items.find((i: any) => i.id === index);
        if (!info) return app;

        return {
            ...app,
            type: info.type || 'app',
            description: info.description || app.description, 
            pricingModel: info.pricing || app.pricingModel,
            features: info.specific_features?.length > 0 ? info.specific_features : app.features, 
            rating: app.rating || info.rating, 
            audience: info.audience,
            platforms: info.platforms
        };
    });
}

// --- HÀM 2: TẠO BÁO CÁO TOP PICK ---
export async function generateMarketReport(
    keyword: string, 
    apps: AppItem[], 
    targets: SeedingTarget[]
): Promise<string> {
    if (!GEMINI_API_KEY) return '';

    const topApps = apps
        .filter(a => a.type === 'app')
        .slice(0, 5)
        .map(a => `Name: "${a.name}", Price: ${a.pricingModel}, Real_Rating: ${a.rating || 'N/A'}, Info: "${a.description}"`)
        .join('\n');

    const prompt = `
    Role: Objective Software Reviewer.
    Topic: Buying advice for "${keyword}".
    Candidates:
    ${topApps}
    
    Task: Generate JSON report.
    1. "editor_choice": { "name", "summary", "best_for", "rating" (USE REAL DATA), "pros" (array), "con" }
    2. "best_value": { "name", "summary", "price_tag", "best_for" }
    3. "pro_tip": { "title", "content" }
    
    Output JSON Only.
    `;

    const result = await callGemini(prompt, 0.2);
    console.log(result);

    return result ? JSON.stringify(result) : '';
}
