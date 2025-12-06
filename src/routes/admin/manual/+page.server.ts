import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { DOMAIN_CATEGORIES } from '$lib/constants';
import { slugify } from '$lib/utils';

function getBrandName(domain: string): string {
    if (!domain) return 'Site';
    const parts = domain.replace(/^(www|m|app)\./, '').split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

function getDomainCategory(domain: string): string {
    const d = domain.toLowerCase();
    for (const [category, keywords] of Object.entries(DOMAIN_CATEGORIES)) {
        if (keywords.some(k => d.includes(k))) return category;
    }
    return 'UNKNOWN';
}

function extractRichInfo(item: any): string {
    const rich = item.rich_snippet?.top;
    const detected = rich?.detected_extensions || {};
    const extensions = rich?.extensions || [];

    let info = [];
    if (detected.rating) info.push(`Real Rating: ${detected.rating}/5`);
    if (detected.reviews) info.push(`Reviews: ${detected.reviews}`);
    if (extensions.length > 0) info.push(`Extra Info: ${extensions.join(' | ')}`);

    return info.length > 0 ? info.join(' | ') : 'No Rich Data';
}

export const actions: Actions = {
    process_serp: async ({ request }) => {
        const formData = await request.formData();
        const keyword = formData.get('keyword') as string;
        const rawJsonStr = formData.get('rawJson') as string;

        if (!keyword || !rawJsonStr) return fail(400, { missing: true });

        try {
            const rawData = JSON.parse(rawJsonStr);
            const organicResults = rawData.organic_results || [];

            // 1. BE Logic: seeding_targets
            const seedingList = organicResults
                .filter((item: any) => getDomainCategory(item.domain || '') === 'FORUM')
                .map((item: any) => ({
                    source: getBrandName(item.domain),
                    title: item.title,
                    url: item.link,
                    meta: item.displayed_link || 'Discussion',
                    isHijackable: true
                }));
            const seedingTargetsJson = JSON.stringify(seedingList, null, 2);

            // 2. Prepare Context
            const potentialApps = organicResults.filter((item: any) => {
                const cat = getDomainCategory(item.domain || '');
                return cat !== 'FORUM';
            });

            // Lấy alternatives đơn giản để backup
            const alternativesList = potentialApps.map((item: any) => ({
                name: item.title,
                domain: item.domain,
                url: item.link
            }));
            const alternativesJson = JSON.stringify(alternativesList, null, 2);

            const contextData = potentialApps.slice(0, 20).map((item: any, index: number) => {
                return `[Result #${index + 1}]
Domain: ${item.domain}
Title: ${item.title}
Snippet: ${item.snippet}
RICH_DATA: ${extractRichInfo(item)}`;
            }).join('\n-------------------\n');

            // --- PROMPT 1: APPS (FIXED URL NEWLINE BUG) ---
            const promptApps = `
Role: Data Analyst.
Keyword: "${keyword}"
Task: Extract structured data for MAIN Apps found in SERP.

SOURCE DATA:
${contextData}

STRICT GUIDELINES:
1. **Rating**: USE "RICH_DATA" (e.g. "Real Rating: 4.8"). If missing, output 0. **DO NOT GUESS**.
2. **Pricing**: Detect from Snippet/Rich Data. Default "Unknown".
3. **URL**: 
   - **CRITICAL**: The "url" value must be a clean string. **ABSOLUTELY NO NEWLINES** or trailing whitespace inside the quotes.
   - Example Correct: "https://site.com"
   - Example Wrong: "https://site.com\\n"

OUTPUT JSON FORMAT (Array):
[
  {
    "name": "Brand Name",
    "domain": "clean.com",
    "url": "https://full_url.com",
    "description": "Benefit-driven description (max 140 chars)",
    "type": "app",
    "pricingModel": "Free",
    "features": ["Tag1", "Tag2"],
    "rating": 4.8,
    "reviewCount": "1,250"
  }
]
`;

            // --- PROMPT 2: REPORT ---
            const promptReport = `
Role: Software Reviewer.
Keyword: "${keyword}"
Task: Pick winners based on data.

SOURCE DATA:
${contextData}

INSTRUCTIONS:
1. Editor's Choice: Tool with High Rating & Reputation.
2. Best Value: Free/Cheap option.

OUTPUT JSON FORMAT:
{
  "editor_choice": {
    "name": "Brand Name",
    "summary": "Why it wins.",
    "best_for": "Target Audience",
    "rating": 4.8,
    "pros": ["Pro 1", "Pro 2"],
    "con": "Weakness"
  },
  "best_value": {
    "name": "Brand Name",
    "summary": "Why best value.",
    "price_tag": "Free / $Price",
    "best_for": "Target Audience"
  },
  "pro_tip": {
    "title": "Tip Title",
    "content": "Tip Content"
  }
}
`;

            // --- PROMPT 3: ALTERNATIVES ---
            const promptAlternatives = `
Role: Research Assistant.
Keyword: "${keyword}"
Task: List 5-8 alternative tools mentioned in context.

SOURCE DATA:
${contextData}

INSTRUCTIONS:
1. Find competitors mentioned in titles like "Top 10..." or snippets.
2. **CRITICAL**: "url" must NOT contain newlines.

OUTPUT JSON FORMAT (Array):
[
  {
    "name": "Tool Name",
    "domain": "tool.com",
    "url": "https://tool.com"
  }
]
`;


            const slug = slugify(keyword);

            return {
                success: true,
                slug,
                seedingTargetsJson,
                alternativesJson,
                promptApps,
                promptReport,
                promptAlternatives
            };

        } catch (error: any) {
            console.error(error);
            return fail(500, { error: 'Processing Error: ' + error.message });
        }
    }
};
