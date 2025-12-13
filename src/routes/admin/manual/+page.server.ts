// src/routes/admin/manual/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { DOMAIN_CATEGORIES } from '$lib/constants';
import { slugify } from '$lib/utils';
import { BRAVE_API_KEY } from '$env/static/private';

// Whitelist: Những thằng này auto là Tool, miễn bàn
const TRUSTED_DOMAINS = [
    // General / Design
    'canva.com', 'adobe.com', 'fotor.com', 'visme.co', 'picsart.com', 
    'snappa.com', 'vistacreate.com', 'figma.com', 'capcut.com',
    // Headshot (Đã có)
    'studioshot.ai', 'aragon.ai', 'headshotpro.com',
    // Etsy / E-commerce (THÊM MỚI)
    'erank.com', 'marmalead.com', 'everbee.io', 'alura.io', 
    'saleasamurai.io', 'insightfactory.app', 'printify.com', 'printful.com',
    // Hosting
    'bluehost.com', 'hostinger.com', 'siteground.com', 'dreamhost.com',
    'wpengine.com', 'kinsta.com', 'cloudways.com', 'digitalocean.com'
];

function getBrandName(item: any): string {
    if (item.profile?.name) return item.profile.name;
    try {
        const domain = new URL(item.url).hostname.replace(/^www\./, '');
        const parts = domain.split('.');
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch (e) { return 'Site'; }
}

function getDomainCategory(url: string): string {
    try {
        const domain = new URL(url).hostname.toLowerCase();
        for (const [category, keywords] of Object.entries(DOMAIN_CATEGORIES)) {
            if (keywords.some(k => domain.includes(k))) return category;
        }
    } catch (e) {}
    return 'UNKNOWN';
}

function getFullDate(item: any): string {
    if (item.age) return item.age;
    if (item.page_age) {
        try {
            return new Date(item.page_age).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
            });
        } catch (e) { return ''; }
    }
    return '';
}

export const actions: Actions = {
    process_serp: async ({ request }) => {
        const formData = await request.formData();
        const keyword = formData.get('keyword') as string;

        if (!keyword) return fail(400, { missing: true });
        if (!BRAVE_API_KEY) return fail(500, { error: 'Missing BRAVE_API_KEY' });

        try {
            // 1. CALL BRAVE API
            const params = new URLSearchParams({
                q: keyword,
                country: 'us',
                search_lang: 'en',
                extra_snippets: 'true',
                count: '20' 
            });

            const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'X-Subscription-Token': BRAVE_API_KEY,
                },
            });

            if (!response.ok) throw new Error(await response.text());

            const rawData = await response.json();
            const results = rawData.web?.results || [];

            // 2. PHÂN LOẠI THÔNG MINH (LOGIC ĐÃ SỬA)

            const appsList: any[] = [];
            const discussionList: any[] = [];
            const articleList: any[] = [];

            results.forEach((item: any) => {
                const sub = item.subtype; // generic, article, qa, faq...
                const domain = new URL(item.url).hostname.replace(/^www\./, '');
                const cat = getDomainCategory(item.url);
                const titleLower = item.title.toLowerCase();

                // Check 1: Whitelist -> Luôn là App
                if (TRUSTED_DOMAINS.some(d => domain.includes(d))) {
                    appsList.push(item);
                    return;
                }

                // Check 2: Forum/QA -> Luôn là Discussion
                if (sub === 'qa' || cat === 'FORUM') {
                    discussionList.push(item);
                    return;
                }

                // Check 3: Dấu hiệu bài viết "Top List" / "Review" -> Là Article
                // (Chỉ áp dụng nếu không phải whitelist)
                const isListicle = titleLower.includes('top ') || titleLower.includes('best ') || titleLower.includes(' review');
                
                // QUAN TRỌNG: Chỉ đẩy vào Article nếu subtype rõ ràng là article hoặc là bài tổng hợp
                // 'generic', 'faq', 'creative_work' ... sẽ KHÔNG chui vào đây nữa
                if (sub === 'article' || isListicle) {
                    articleList.push(item);
                    return;
                }

                // Check 4: CÒN LẠI -> LÀ APP (Tool)
                // generic, faq, product, software... chui hết vào đây
                appsList.push(item);
            });

            // --- A. Build Seeding List (Gộp Discussion + Article) ---
            const seedingList = [
                ...discussionList.map(item => ({
                    source: getBrandName(item),
                    title: item.title,
                    url: item.url,
                    meta: getFullDate(item) || 'Discussion',
                    isHijackable: true
                })),
                ...articleList.map(item => ({
                    source: getBrandName(item),
                    title: item.title,
                    url: item.url,
                    meta: getFullDate(item) || 'Article',
                    isHijackable: false
                }))
            ];
            const seedingTargetsJson = JSON.stringify(seedingList, null, 2);

            // --- B. Build Apps List (Dùng cho AI Prompt) ---
            // Lấy alternatives backup từ đây luôn
            const alternativesList = appsList.slice(0, 8).map((item: any) => ({
                name: getBrandName(item),
                domain: new URL(item.url).hostname.replace(/^www\./, ''),
                url: item.url
            }));
            const alternativesJson = JSON.stringify(alternativesList, null, 2);

            // Context Data
            const contextData = appsList.slice(0, 20).map((item: any, index: number) => {
                const domain = new URL(item.url).hostname.replace(/^www\./, '');
                return `[Result #${index + 1}]
Name: ${item.title}
Domain: ${domain}
Snippet: ${item.description}
Type: ${item.subtype || 'generic'}`; 
            }).join('\n-------------------\n');

            // --- PROMPT 1: TECH ANALYST ---
const promptApps = `
Role: Critical Tech Journalist.
Keyword: "${keyword}"
Task: Analyze software tools to find their **Specific Value** from snippets.

SOURCE DATA:
${contextData}

STRICT GUIDELINES:
1. **Name**: 
   - Extract the BRAND NAME only. 
   - Remove generic SEO keywords like "Best", "Free", "Tool", "App", "Online" unless it's part of the brand.
   - Example: Change "Object Remover: Remove Object & People From Photos" -> "Adobe Photoshop".
   - Example: Change "Free AI Object Remover From Photo" -> "AirBrush".
2. **Tool Identification**: Pick only legitimate SOFTWARE/SAAS.
3. **Pricing**: 
   - Detect [Free, Freemium, Paid].
   - "Free" means 100% free (rare). "Freemium" means free trial/credits.
   - If unsure, default to "Freemium".
   - 'Free Trial' is NOT 'Freemium'. Mark as 'Paid' unless there is a 'Free Forever' plan explicitly mentioned. Be strict.
4. **"Best For" (User Persona) - INFERENCE REQUIRED**: 
   - **Step 1**: Look for explicit keywords (LinkedIn, Teams, Developers).
   - **Step 2**: If missing, INFER from features:
     - "No signup/No credit card" -> **"Privacy/Quick Use"**
     - "Bulk/API" -> **"Developers/Teams"**
     - "Selfie/Home" -> **"Casual Users"**
     - "Studio/Professional" -> **"Job Seekers"**
   - **Constraint**: Max 3 words. NO "Everyone" or "Users".
5. **Features (HARD FILTER)**:
   - Extract 2-3 **FUNCTIONAL** features.
   - **BANNED WORDS**: Fast, Quick, Easy, Simple, Stunning, Best, Amazing.
   - **PREFERRED**: "No Credit Card", "Browser-based", "10+ Styles", "Secure", "No Install".
6. **Rating**: LEAVE 0.

OUTPUT JSON FORMAT (Array):
[
  {
    "name": "Brand Name",
    "domain": "site.com",
    "url": "https://site.com", 
    "description": "Functional description (max 15 words).", 
    "type": "app",
    "pricingModel": "Freemium",
    "audience": "Privacy/Quick Use", 
    "features": ["No Credit Card", "Browser-based"]
  }
]
`;

            // --- PROMPT 2: MARKET REPORT ---
const promptReport = `
Role: Senior Market Analyst.
Keyword: "${keyword}"
Task: Summarize the market landscape based on DATA.

DATA CONTEXT:
${contextData}

STRICT GUIDELINES:
1. **"Editor's Choice" -> "Market Leader"**:
   - Do NOT pick a random tool based on "quality" (you don't know quality).
   - PICK THE MOST FAMOUS / REPUTABLE BRAND in the list (e.g. Canva, Adobe, Fotor).
   - If no big brand, pick the one with the most functional features mentioned.
   - **Summary**: Write WHY it is popular (e.g. "Widely used," "All-in-one platform"). NO marketing hype ("Amazing," "Incredible").

2. **"Best Value"**:
   - Pick the tool that explicitly mentions "100% Free" or "No Signup" in the snippet.
   - If none, pick a "Freemium" one.

3. **"Pro Tip" (CRITICAL)**:
   - **DO NOT recommend a specific tool here.**
   - Provide a **GENERAL BUYING ADVICE** for this specific niche.
   - Example for "Headshot": "Look for tools that offer high-resolution downloads and don't watermark the final image. Check privacy policies regarding face data."
   - Keep it actionable and short (2 sentences).

OUTPUT JSON:
{
  "editor_choice": {
    "name": "Brand Name",
    "summary": "Factual summary of why it's a safe choice.",
    "best_for": "Target Audience",
    "pros": ["Fact 1", "Fact 2"],
    "con": "Limitation (e.g. 'Advanced features require payment')"
  },
  "best_value": {
    "name": "Tool Name",
    "summary": "Free / Low cost option.",
    "price_tag": "Free / Freemium",
    "best_for": "Casual Users"
  },
  "pro_tip": {
    "title": "Quick Buying Advice",
    "content": "General advice for users in this niche."
  }
}
`;

            // --- PROMPT 3: ALTERNATIVES ---
            const promptAlternatives = `
Role: Assistant.
Task: List 5-8 alternatives.
OUTPUT JSON (Array): [{ "name": "...", "domain": "...", "url": "..." }]
`;

            const slug = slugify(keyword);

            return {
                success: true,
                slug,
                seedingTargetsJson,
                alternativesJson,
                promptApps,
                promptReport,
                promptAlternatives,
                rawResponse: JSON.stringify(rawData) 
            };

        } catch (error: any) {
            console.error('API Error:', error);
            return fail(500, { error: 'Error: ' + error.message });
        }
    }
};
