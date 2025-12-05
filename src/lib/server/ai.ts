// src/lib/server/ai.ts
import { GROQ_API_KEY } from '$env/static/private';
import type { AppItem, SeedingTarget } from '$lib/types';

export async function generateMarketReport(
    keyword: string, 
    apps: AppItem[], 
    targets: SeedingTarget[]
): Promise<string> {
    if (!GROQ_API_KEY) {
        console.warn('⚠️ Missing GROQ_API_KEY in .env');
        return '';
    }

    // 1. Lọc data App
    const candidates = apps
        .slice(0, 10)
        .map(a => `- Name: ${a.name} | Pricing: ${a.pricingModel} | Features: ${a.features.join(', ')} | Rating: ${a.rating || 'N/A'}`)
        .join('\n');
        
    // 2. Lọc data Discussion (Chỉ lấy nếu API thực sự trả về)
    const discussionList = targets
        .filter(t => {
            const s = t.source.toLowerCase();
            return s.includes('reddit') || s.includes('hacker') || s.includes('indie') || s.includes('quora');
        })
        .slice(0, 5)
        .map(t => `- "${t.title}" (Source: ${t.source})`);

    const voices = discussionList.join('\n');
    const hasCommunityData = discussionList.length > 0;

    // 3. PROMPT "BUYING GUIDE" (Đã fix lỗi ảo tưởng)
    // Chỉ thị rõ: Có data thì dùng, không có thì đưa lời khuyên chung.
    const prompt = `
    Role: Objective Software Reviewer.
    Topic: Quick buying guide for "${keyword}".
    
    [Real-time Search Data]
    ${candidates}
    
    [Community Discussions (Might be empty)]
    ${voices}

    Task: Write a short "Quick Pick" summary (max 120 words).
    
    Guidelines:
    - Be direct. No intro fluff like "There are many tools".
    - Base "Top Choice" strictly on the provided Ratings/Features in Data.
    - IMPORTANT: If [Community Discussions] is empty, DO NOT invent/hallucinate opinions. Instead, give a general "Pro Tip" for this specific software category (e.g., "Check for API support").
    
    Required HTML Format:
    <p><strong>🏆 Top Choice:</strong> [Pick the best tool]. Why: [1 factual reason from data].</p>
    <p><strong>💰 Best Value:</strong> [Pick a Free/Freemium tool]. Ideal for [Who?].</p>
    <p><strong>💡 Pro Tip:</strong> [If community data exists: Summarize the main complaint/praise. If NO community data: Give a generic advice on what to look for when buying this type of tool].</p>
    `;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.3,
                max_tokens: 350
            })
        });

        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';

    } catch (e) {
        console.error('AI Gen Error:', e);
        return '';
    }
}
