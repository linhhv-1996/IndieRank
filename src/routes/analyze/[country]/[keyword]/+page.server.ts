import type { PageServerLoad } from './$types';
import type { RawApiResponse, AnalysisResult, SerpItem, SeedingTarget, Verdict } from '$lib/types';
import { PRIVATE_VALUESERP_API_KEY } from '$env/static/private';
import { COUNTRIES } from '$lib/country_config';
import { DOMAIN_KS } from '$lib/constants';


const COUNTRY_MAP = COUNTRIES.reduce((acc, curr) => {
    let hl = 'en';
    if (curr.gl === 'vn') hl = 'vi';
    else if (curr.gl === 'tw') hl = 'zh-TW';

    acc[curr.gl] = { gl: curr.gl, hl: hl, google_domain: curr.domain };
    return acc;
}, {} as Record<string, { gl: string; hl: string; google_domain: string }>);

function unslugify(slug: string) {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getBrandName(input: string): string {
    if (!input) return '';
    let urlLike = input.trim();
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(urlLike)) {
        urlLike = 'https://' + urlLike;
    }
    try {
        const hostname = new URL(urlLike).hostname.toLowerCase();
        const parts = hostname.replace(/^(www|m|app)\./, '').split('.');
        if (parts.length < 2) return parts[0] || 'Site';
        // Lấy phần tên chính (domain without tld)
        return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
    } catch {
        return 'Site';
    }
}

// Helper lấy meta info từ snippet (số comment, ngày tháng)
function extractMetaFromOrganic(item: any): string {
    const displayed = item.displayed_link?.toLowerCase() || '';
    if (displayed.includes('ago') || displayed.includes('comment') || displayed.includes('answer') || displayed.startsWith('http')) {
        return item.displayed_link;
    }
    const extensions = item.rich_snippet?.top?.extensions || [];
    const commentExt = extensions.find((e: string) => 
        e.toLowerCase().includes('answer') || e.toLowerCase().includes('comment')
    );
    return commentExt || `Rank #${item.position}`;
}

// ==========================================
// 2. HELPER: CATEGORIZE DOMAIN
// ==========================================
function categorizeDomain(domain: string, title: string): { type: string, isWeak: boolean, scoreCategory: 'ULTRA' | 'WEAK' | 'HARD' | 'NORMAL' } {
    const d = domain ? domain.toLowerCase() : '';
    const t = title ? title.toLowerCase() : '';
    const checkList = (keywords: string[]) => keywords.some(k => d.includes(k.toLowerCase()));

    if (checkList(DOMAIN_KS.PUBLIC_DOCS) || t.includes('.pdf') || t.includes('.doc') || t.includes('sheet')) {
        return { type: 'Public Doc', isWeak: true, scoreCategory: 'ULTRA' };
    }
    if (checkList(DOMAIN_KS.SOCIAL_FORUMS)) {
        return { type: 'Community', isWeak: true, scoreCategory: 'WEAK' };
    }
    if (checkList(DOMAIN_KS.REVIEW_GIANTS)) {
        return { type: 'Review Giant', isWeak: false, scoreCategory: 'HARD' };
    }
    if (checkList(DOMAIN_KS.TECH_GIANTS)) {
        return { type: 'Tech Repo', isWeak: false, scoreCategory: 'HARD' };
    }
    return { type: 'Web/Blog', isWeak: false, scoreCategory: 'NORMAL' };
}

// ==========================================
// 3. CORE LOGIC: ANALYZE MARKET
// ==========================================
function analyzeMarket(serpItems: SerpItem[], seedingTargets: SeedingTarget[]): Verdict {
    let opportunityScore = 0;
    let hardObstaclesInTop3 = 0;
    
    const giants = serpItems
        .filter(i => !i.isWeakSpot && parseInt(i.rank) <= 3)
        .map(i => getBrandName(i.url))
        .slice(0, 2)
        .join(', ');

    serpItems.forEach((item) => {
        const rank = parseInt(item.rank);
        const scoreCategory = item.scoreCategory || 'NORMAL';

        if (scoreCategory === 'ULTRA') {
            if (rank <= 3) opportunityScore += 30;
            else opportunityScore += 10;
        } else if (scoreCategory === 'WEAK') {
            if (rank <= 3) opportunityScore += 15;
            else if (rank <= 5) opportunityScore += 5;
            else opportunityScore += 2;
        } else if (scoreCategory === 'HARD') {
            if (rank <= 3) hardObstaclesInTop3++;
        }
    });

    if (hardObstaclesInTop3 >= 2) {
        return {
            status: "Saturated",
            title: "DON'T BUILD HERE",
            description: `<b>Dangerous Territory.</b> The Top 3 is dominated by review giants/ads like <b>${giants}</b>. Users are looking for comparisons, not a new tool. <br><i>Advice: Niche down further.</i>`,
            color: "red"
        };
    }

    if (opportunityScore >= 20) {
        return {
            status: "SEO Goldmine",
            title: "BUILD IMMEDIATELY",
            description: `<b>Perfect Condition.</b> Google is ranking PDFs, Docs, or Forum threads in the Top 3. There is NO authoritative software satisfying this intent.`,
            color: "green"
        };
    }

    if (opportunityScore >= 5 || seedingTargets.length > 0) {
         return {
            status: "Seeding Gap",
            title: "HIJACK TRAFFIC",
            description: `<b>Good Entry Point.</b> Hard to SEO directly against <b>${giants}</b>, but several high-authority community posts already rank for this query. <br><i>Strategy: Use "Parasite SEO" by piggybacking on those existing platforms (posts, templates, videos...) instead of trying to rank a new standalone page.</i>`,
            color: "yellow"
        };
    }

    return {
        status: "Competitive",
        title: "UPHILL BATTLE",
        description: `No obvious weak spots. The SERP is filled with established blogs and brands.`,
        color: "red"
    };
}

// ==========================================
// 4. MAIN LOAD FUNCTION (Robust)
// ==========================================
export const load: PageServerLoad = async ({ params }) => {
    const countryCode = params.country.toLowerCase();
    const rawKeyword = params.keyword;
    const readableKeyword = unslugify(rawKeyword);

    const metaData = {
        keyword: readableKeyword,
        slug: rawKeyword,
        country: countryCode.toUpperCase(),
        metaTitle: `${readableKeyword} Analysis`,
        metaDesc: `Analysis for ${readableKeyword}`,
    };

    const loadAnalysisData = async (): Promise<AnalysisResult> => {
        const config = COUNTRY_MAP[countryCode] || COUNTRY_MAP['us'];
        const url = new URL('https://api.valueserp.com/search');
        
        url.searchParams.append('api_key', PRIVATE_VALUESERP_API_KEY);
        url.searchParams.append('q', readableKeyword);
        url.searchParams.append('gl', config.gl);
        url.searchParams.append('hl', 'en');
        url.searchParams.append('google_domain', config.google_domain);
        
        // Bật hết cờ để lấy tối đa dữ liệu có thể
        url.searchParams.append('include_answer_box', 'true');
        url.searchParams.append('include_ai_overview', 'true');
        url.searchParams.append('max_page', '1');

        try {
            // const res = await fetch(url.toString());
            // if (!res.ok) throw new Error(`ValueSERP API Error: ${res.statusText}`);

            // const apiData: RawApiResponse = await res.json();

            // if (apiData.request_info && apiData.request_info.success === false) {
            //     throw new Error(apiData.request_info.message || 'API request failed');
            // }

            const apiData = {
  "request_info": {
    "success": true,
    "topup_credits_remaining": 73,
    "credits_used_this_request": 2
  },
  "search_parameters": {
    "q": "Habit Tracker Notion Template",
    "gl": "us",
    "hl": "en",
    "google_domain": "google.com",
    "include_ai_overview": "true",
    "include_answer_box": "true",
    "max_page": "2",
    "engine": "google"
  },
  "search_metadata": {
    "created_at": "2025-12-02T15:44:44.588Z",
    "processed_at": "2025-12-02T15:44:47.498Z",
    "total_time_taken": 2.91,
    "engine_url": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&gl=us&hl=en",
    "html_url": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit+Tracker+Notion+Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&engine=google&output=html",
    "json_url": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit+Tracker+Notion+Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&engine=google&output=json"
  },
  "organic_results": [
    {
      "position": 1,
      "block_position": 1,
      "title": "Habit Tracking Templates",
      "link": "https://www.notion.com/templates/category/habit-tracking?srsltid=AfmBOoqMzRMvX-RcgniH77w0a-az52bxQ2egg0iNJQp7HWvywJJTFqAU",
      "domain": "www.notion.com",
      "displayed_link": "https://www.notion.com › ... › School › Student Life",
      "snippet": "Designed to help you build and maintain positive habits, our templates offer daily, weekly, and monthly trackers, motivating you towards consistent improvement.",
      "prerender": false,
      "sitelinks": {
        "expanded": [
          {
            "title": "Top Habit Tracking templates",
            "link": "https://www.notion.com/templates/category/best-habit-tracking-templates?srsltid=AfmBOorOu5FY1PKVbtmp-PwpVIAaI3xhaaeuSzXL4xS70tyxnPomOPhp",
            "snippet": "Designed to help you build and maintain positive habits, our ..."
          },
          {
            "title": "Free",
            "link": "https://www.notion.com/templates/category/free-habit-tracking-templates?srsltid=AfmBOop5oIz9FSldRNWkXqZy5K4-WEBzDbgeVMTKuYDyoqq0GG7VjuwY",
            "snippet": "Designed to help you build and maintain positive habits, our ..."
          }
        ]
      },
      "sitelinks_search_box": false,
      "page": 1,
      "position_overall": 1
    },
    {
      "position": 2,
      "block_position": 2,
      "title": "I created a notion habit tracker that automatically refreshes ...",
      "link": "https://www.reddit.com/r/Notion/comments/101tpgb/i_created_a_notion_habit_tracker_that/",
      "domain": "www.reddit.com",
      "displayed_link": "40+ comments  ·  2 years ago",
      "snippet": "A notion habit tracker that refreshes your checklist weekly. There is a step-by-step video guide included to help you set it up within minutes.",
      "prerender": false,
      "page": 1,
      "position_overall": 2
    },
    {
      "position": 3,
      "block_position": 3,
      "title": "5 Ways to Build a Habit Tracker in Notion (Free Template ...",
      "link": "https://thomasjfrank.com/5-ways-to-build-a-habit-tracker-in-notion-free-template-included/",
      "domain": "thomasjfrank.com",
      "displayed_link": "https://thomasjfrank.com › 5-ways-to-build-a-habit-trac...",
      "snippet": "In this guide, I'll show you how to build habit trackers in Notion at five different levels. You can also use the free template I've provided.",
      "prerender": false,
      "page": 1,
      "position_overall": 3
    },
    {
      "position": 4,
      "block_position": 4,
      "title": "The Best & Free Notion Habit Tracker Templates of 2025",
      "link": "https://super.so/templates/the-best-free-notion-habit-tracker-templates-of-2023",
      "domain": "super.so",
      "displayed_link": "https://super.so › templates › the-best-free-notion-habit-tr...",
      "snippet": "These free Notion habit tracker templates are designed to make tracking your progress simple and even a bit fun, coming with everything you need to start ...",
      "prerender": false,
      "page": 1,
      "position_overall": 4
    },
    {
      "position": 5,
      "block_position": 7,
      "title": "20 Free & Aesthetic Notion Habit Tracker Templates (2024)",
      "link": "https://www.notionavenue.co/post/notion-habit-tracker-templates",
      "domain": "www.notionavenue.co",
      "displayed_link": "https://www.notionavenue.co › post › notion-habit-trac...",
      "snippet": "We have curated the best Habit Tracker Templates for Notion in this article, so you can find the one that's right for you or get some ideas to build or improve ...",
      "prerender": false,
      "page": 1,
      "position_overall": 5
    },
    {
      "position": 6,
      "block_position": 8,
      "title": "Habit tracker 2025 Template | Notion Marketplace",
      "link": "https://www.notion.com/templates/notion-habit-tracker?srsltid=AfmBOorTv8NgMJIMz-yOAAyoyprJ_bYqiqAS60_XA9jU5K_ZhF4t3T91",
      "domain": "www.notion.com",
      "displayed_link": "https://www.notion.com › templates › notion-habit-trac...",
      "snippet": "This automated habit tracker template helps build healthy habits, using a button block to easily check off completed habits daily.",
      "prerender": false,
      "page": 1,
      "position_overall": 6
    },
    {
      "position": 1,
      "block_position": 1,
      "title": "99 FREE Notion Templates for Everything [2025]",
      "link": "https://www.notioneverything.com/blog/free-notion-templates",
      "domain": "www.notioneverything.com",
      "displayed_link": "https://www.notioneverything.com › blog › free-notion...",
      "snippet": "Jul 2, 2025 — Free Notion templates cover personal organization, productivity, business, project management, habit tracking, and more, for managing every ...",
      "prerender": false,
      "date": "Jul 2, 2025",
      "date_utc": "2025-07-02T00:00:00.000Z",
      "page": 2,
      "position_overall": 7
    },
    {
      "position": 2,
      "block_position": 2,
      "title": "25 Best & Free Notion Habit Tracker Templates for 2025",
      "link": "https://pathpages.com/blog/notion-habit-tracker-templates",
      "domain": "pathpages.com",
      "displayed_link": "https://pathpages.com › blog › notion-habit-tracker-tem...",
      "snippet": "Feb 19, 2025 — Discover the best free Notion habit tracker templates to help you stay organized, motivated, and on track with your 2025 goals!",
      "prerender": false,
      "date": "Feb 19, 2025",
      "date_utc": "2025-02-19T00:00:00.000Z",
      "page": 2,
      "position_overall": 8
    },
    {
      "position": 3,
      "block_position": 3,
      "title": "Notion Template Habit Tracker",
      "link": "https://www.pinterest.com/ideas/notion-template-habit-tracker/934480381335/",
      "domain": "www.pinterest.com",
      "displayed_link": "https://www.pinterest.com › ... › Design › Product Design",
      "snippet": "Discover Pinterest's best ideas and inspiration for Notion template habit tracker. Get inspired and try out new things. 1k people searched this.",
      "prerender": false,
      "page": 2,
      "position_overall": 9
    },
    {
      "position": 4,
      "block_position": 4,
      "title": "Top 8 Free Habit Tracking Templates",
      "link": "https://www.notion.com/templates/collections/top-10-free-habit-tracking-templates-in-notion?srsltid=AfmBOopJRFSiP9Os2r9_fsUJPdYsIcDKq5VyyBIqL-QtgNIYVe2fiF0o",
      "domain": "www.notion.com",
      "displayed_link": "https://www.notion.com › templates › collections › top-...",
      "snippet": "Habit trackers monitor progress toward forming new habits. Good templates include customizability, visual progress, and reminders. Avoid overly complex layouts.",
      "prerender": false,
      "page": 2,
      "position_overall": 10
    },
    {
      "position": 5,
      "block_position": 5,
      "title": "10 Best Notion Habit Tracker Templates 2024",
      "link": "https://www.nicheplates.com/blog/10-best-notion-habit-tracker-templates",
      "domain": "www.nicheplates.com",
      "displayed_link": "https://www.nicheplates.com › blog › 10-best-notion-ha...",
      "snippet": "Apr 17, 2024 — The 10 best Notion Habit Tracker Templates in 2024 for organizing your daily routines and achieving personal habit plans with peace of mind.",
      "prerender": false,
      "date": "Apr 17, 2024",
      "date_utc": "2024-04-17T00:00:00.000Z",
      "page": 2,
      "position_overall": 11
    },
    {
      "position": 6,
      "block_position": 6,
      "title": "12 Best Notion Habit Tracker Templates to Use in 2025",
      "link": "https://www.widgetly.co/blog/notion-habit-tracker-templates",
      "domain": "www.widgetly.co",
      "displayed_link": "https://www.widgetly.co › blog › notion-habit-tracker-te...",
      "snippet": "Aug 26, 2025 — This guide lists 12 Notion habit tracker templates, from minimalist free options to advanced dashboards, including the Widgetly widget and the ...",
      "prerender": false,
      "date": "Aug 26, 2025",
      "date_utc": "2025-08-26T00:00:00.000Z",
      "page": 2,
      "position_overall": 12
    },
    {
      "position": 7,
      "block_position": 7,
      "title": "Habit Tracker | Notion Template",
      "link": "https://www.easlo.co/templates/habit-tracker",
      "domain": "www.easlo.co",
      "displayed_link": "https://www.easlo.co › templates › habit-tracker",
      "snippet": "Mar 12, 2025 — This Notion template tracks your daily habits and routines, helping you visualize progress and maintain consistency.",
      "prerender": false,
      "date": "Mar 12, 2025",
      "date_utc": "2025-03-12T00:00:00.000Z",
      "page": 2,
      "position_overall": 13
    },
    {
      "position": 8,
      "block_position": 8,
      "title": "Habit Tracker - Free Notion Template",
      "link": "https://pathpages.com/free-notion-templates/notion-habit-tracker",
      "domain": "pathpages.com",
      "displayed_link": "https://pathpages.com › free-notion-templates › notion-...",
      "snippet": "The Notion Habit Tracker is a free, minimalist template that helps you build better daily habits by tracking your actions over time. Whether you're forming a ...",
      "prerender": false,
      "page": 2,
      "position_overall": 14
    },
    {
      "position": 9,
      "block_position": 10,
      "title": "15 Notion Habit Tracker Templates to Help You Stay on Track",
      "link": "https://geekflare.com/guide/notion-habit-tracker-templates/",
      "domain": "geekflare.com",
      "displayed_link": "https://geekflare.com › guide › notion-habit-tracker-te...",
      "snippet": "Dec 25, 2024 — Notion Habit Tracker Templates help to improve productivity by letting you track your habits in an organized manner.",
      "prerender": false,
      "date": "Dec 25, 2024",
      "date_utc": "2024-12-25T00:00:00.000Z",
      "page": 2,
      "position_overall": 15
    }
  ],
  "related_searches": [
    {
      "query": "Habit tracker notion template free",
      "link": "https://www.google.com/search?sca_esv=65d22011d5166a01&gl=us&hl=en&q=Habit+tracker+notion+template+free&sa=X&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ1QJ6BAhFEAE",
      "block_position": 10
    },
    {
      "query": "Habit tracker Notion template free aesthetic",
      "link": "https://www.google.com/search?sca_esv=65d22011d5166a01&gl=us&hl=en&q=Habit+tracker+Notion+template+free+aesthetic&sa=X&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ1QJ6BAhJEAE",
      "block_position": 10
    },
    {
      "query": "Habit tracker notion template free download",
      "link": "https://www.google.com/search?sca_esv=65d22011d5166a01&gl=us&hl=en&q=Habit+tracker+notion+template+free+download&sa=X&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ1QJ6BAhKEAE",
      "block_position": 10
    },
    {
      "query": "Notion habit Tracker template with progress bar",
      "link": "https://www.google.com/search?sca_esv=65d22011d5166a01&gl=us&hl=en&q=Notion+habit+Tracker+template+with+progress+bar&sa=X&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ1QJ6BAhLEAE",
      "block_position": 10
    },
    {
      "query": "Gamified habit Tracker Notion",
      "link": "https://www.google.com/search?sca_esv=65d22011d5166a01&gl=us&hl=en&q=Gamified+habit+Tracker+Notion&sa=X&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ1QJ6BAhEEAE",
      "block_position": 10
    },
    {
      "query": "Monthly habit tracker Notion",
      "link": "https://www.google.com/search?sca_esv=65d22011d5166a01&gl=us&hl=en&q=Monthly+habit+tracker+Notion&sa=X&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ1QJ6BAhGEAE",
      "block_position": 10
    },
    {
      "query": "Simple habit tracker Notion",
      "link": "https://www.google.com/search?sca_esv=65d22011d5166a01&gl=us&hl=en&q=Simple+habit+tracker+Notion&sa=X&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ1QJ6BAhHEAE",
      "block_position": 10
    },
    {
      "query": "Best habit tracker Notion",
      "link": "https://www.google.com/search?sca_esv=65d22011d5166a01&gl=us&hl=en&q=Best+habit+tracker+Notion&sa=X&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ1QJ6BAhIEAE",
      "block_position": 10
    }
  ],
  "inline_videos": [
    {
      "position": 1,
      "title": "How to Build a Habit Tracker in Notion from Scratch",
      "length": "40.1",
      "source": "YouTube · Thomas Frank ExplainsYouTube · Thomas Frank Explains",
      "block_position": 5
    },
    {
      "position": 2,
      "title": "Build an Advanced Habit Tracker with Charts & Statistics in ...",
      "length": "26.15",
      "source": "YouTube · Creative CoveYouTube · Creative Cove",
      "block_position": 5
    },
    {
      "position": 3,
      "title": "2025 NOTION TUTORIAL how to make a notion habit tracker",
      "length": "21.41",
      "source": "YouTube · TsuneYouTube · Tsune",
      "block_position": 5
    }
  ],
  "inline_images": [
    {
      "title": "The Ultimate Habit Tracker with Progress Chart Template by ...",
      "image": "data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
      "link": "https://www.notion.com/templates/habittracker?srsltid=AfmBOooar1XiS9stNIBx1Ob2oQmyqJPaLCC1PcWpD6nGQ0Knr9TbCcgr",
      "block_position": 6
    },
    {
      "title": "I created a notion habit tracker that automatically ...",
      "image": "data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
      "link": "https://www.reddit.com/r/Notion/comments/101tpgb/i_created_a_notion_habit_tracker_that/",
      "block_position": 6
    },
    {
      "title": "Top 8 Free Habit Tracking Templates | Notion Template ...",
      "image": "data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
      "link": "https://www.notion.com/templates/collections/top-10-free-habit-tracking-templates-in-notion?srsltid=AfmBOopc7KFgD-KU_2PHdE_69TWCPPSuSe2gOLcbNJRK5YwzHSSB7c_M",
      "block_position": 6
    },
    {
      "title": "How To Use Notion Rollups To Build A Habit Tracker — Red Gregory",
      "image": "data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
      "link": "https://www.redgregory.com/notion/2022/9/29/how-to-use-notion-rollups-to-build-a-habit-tracker",
      "block_position": 6
    },
    {
      "title": "Build a Habit Tracker with Notion (Tutorial + Template)",
      "image": "data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
      "link": "https://www.youtube.com/watch?v=1-erJ61FjKE",
      "block_position": 6
    },
    {
      "title": "Free Notion Habit Tracker Template with Progress Bar ...",
      "image": "data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
      "link": "https://www.claritymastery.co/products/notion-habit-tracker",
      "block_position": 6
    }
  ],
  "search_information": {
    "original_query_yields_zero_results": false,
    "total_results": 634000
  },
  "pagination": {
    "pages": [
      {
        "current": 1,
        "next": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bAkvaYG9PL_q7_UPhMaooQo&start=10&sa=N&sstk=Af77f_dA2uyT59zUJYpx8SdA-zY5KbLSvoytcaR6kmS3FZjZfzfaPoLY6lbh5MisjpQuKtRJj4nd8WsUnyq3gRdv1mYUpPTD8GLkOw&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ8NMDegQIKBAW",
        "other_pages": [
          {
            "page": 2,
            "link": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bAkvaYG9PL_q7_UPhMaooQo&start=10&sa=N&sstk=Af77f_dA2uyT59zUJYpx8SdA-zY5KbLSvoytcaR6kmS3FZjZfzfaPoLY6lbh5MisjpQuKtRJj4nd8WsUnyq3gRdv1mYUpPTD8GLkOw&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ8tMDegQIKBAE"
          },
          {
            "page": 3,
            "link": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bAkvaYG9PL_q7_UPhMaooQo&start=20&sa=N&sstk=Af77f_dA2uyT59zUJYpx8SdA-zY5KbLSvoytcaR6kmS3FZjZfzfaPoLY6lbh5MisjpQuKtRJj4nd8WsUnyq3gRdv1mYUpPTD8GLkOw&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ8tMDegQIKBAG"
          },
          {
            "page": 4,
            "link": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bAkvaYG9PL_q7_UPhMaooQo&start=30&sa=N&sstk=Af77f_dA2uyT59zUJYpx8SdA-zY5KbLSvoytcaR6kmS3FZjZfzfaPoLY6lbh5MisjpQuKtRJj4nd8WsUnyq3gRdv1mYUpPTD8GLkOw&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ8tMDegQIKBAI"
          },
          {
            "page": 5,
            "link": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bAkvaYG9PL_q7_UPhMaooQo&start=40&sa=N&sstk=Af77f_dA2uyT59zUJYpx8SdA-zY5KbLSvoytcaR6kmS3FZjZfzfaPoLY6lbh5MisjpQuKtRJj4nd8WsUnyq3gRdv1mYUpPTD8GLkOw&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ8tMDegQIKBAK"
          },
          {
            "page": 6,
            "link": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bAkvaYG9PL_q7_UPhMaooQo&start=50&sa=N&sstk=Af77f_dA2uyT59zUJYpx8SdA-zY5KbLSvoytcaR6kmS3FZjZfzfaPoLY6lbh5MisjpQuKtRJj4nd8WsUnyq3gRdv1mYUpPTD8GLkOw&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ8tMDegQIKBAM"
          },
          {
            "page": 7,
            "link": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bAkvaYG9PL_q7_UPhMaooQo&start=60&sa=N&sstk=Af77f_dA2uyT59zUJYpx8SdA-zY5KbLSvoytcaR6kmS3FZjZfzfaPoLY6lbh5MisjpQuKtRJj4nd8WsUnyq3gRdv1mYUpPTD8GLkOw&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ8tMDegQIKBAO"
          },
          {
            "page": 8,
            "link": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bAkvaYG9PL_q7_UPhMaooQo&start=70&sa=N&sstk=Af77f_dA2uyT59zUJYpx8SdA-zY5KbLSvoytcaR6kmS3FZjZfzfaPoLY6lbh5MisjpQuKtRJj4nd8WsUnyq3gRdv1mYUpPTD8GLkOw&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ8tMDegQIKBAQ"
          },
          {
            "page": 9,
            "link": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bAkvaYG9PL_q7_UPhMaooQo&start=80&sa=N&sstk=Af77f_dA2uyT59zUJYpx8SdA-zY5KbLSvoytcaR6kmS3FZjZfzfaPoLY6lbh5MisjpQuKtRJj4nd8WsUnyq3gRdv1mYUpPTD8GLkOw&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ8tMDegQIKBAS"
          },
          {
            "page": 10,
            "link": "https://www.google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bAkvaYG9PL_q7_UPhMaooQo&start=90&sa=N&sstk=Af77f_dA2uyT59zUJYpx8SdA-zY5KbLSvoytcaR6kmS3FZjZfzfaPoLY6lbh5MisjpQuKtRJj4nd8WsUnyq3gRdv1mYUpPTD8GLkOw&ved=2ahUKEwiBo83Mn5-RAxU_9bsIHQQjKqQQ8tMDegQIKBAU"
          }
        ],
        "api_pagination": {
          "next": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&id=req0&antiBlockConfig=%5Bobject%20Object%5D&page=2",
          "other_pages": [
            {
              "page": 2,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&id=req0&antiBlockConfig=%5Bobject%20Object%5D&page=2"
            },
            {
              "page": 3,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&id=req0&antiBlockConfig=%5Bobject%20Object%5D&page=3"
            },
            {
              "page": 4,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&id=req0&antiBlockConfig=%5Bobject%20Object%5D&page=4"
            },
            {
              "page": 5,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&id=req0&antiBlockConfig=%5Bobject%20Object%5D&page=5"
            },
            {
              "page": 6,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&id=req0&antiBlockConfig=%5Bobject%20Object%5D&page=6"
            },
            {
              "page": 7,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&id=req0&antiBlockConfig=%5Bobject%20Object%5D&page=7"
            },
            {
              "page": 8,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&id=req0&antiBlockConfig=%5Bobject%20Object%5D&page=8"
            },
            {
              "page": 9,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&id=req0&antiBlockConfig=%5Bobject%20Object%5D&page=9"
            },
            {
              "page": 10,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&max_page=2&id=req0&antiBlockConfig=%5Bobject%20Object%5D&page=10"
            }
          ]
        },
        "from_sticky_session": true
      },
      {
        "current": 2,
        "next": "https://google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bgkvaeaDJreD9u8P3NaAmA4&start=20&sa=N&sstk=Af77f_eFZKVsAhGpqtW7LYUCiyTrrgz-wDe_nPDde0YRsf-YpN3QJxkoJNFjPlErT056UQYQR4De5lpy6XtWqk6piHf9Glbq3o1K9ojzdKQbPjfs5KzJo1U77BX9IYsn90pd&ved=2ahUKEwjm8rDNn5-RAxW3gf0HHVwrAOM4ChDw0wN6BAgJEBc",
        "other_pages": [
          {
            "page": 1,
            "link": "https://google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bgkvaeaDJreD9u8P3NaAmA4&start=0&sa=N&sstk=Af77f_eFZKVsAhGpqtW7LYUCiyTrrgz-wDe_nPDde0YRsf-YpN3QJxkoJNFjPlErT056UQYQR4De5lpy6XtWqk6piHf9Glbq3o1K9ojzdKQbPjfs5KzJo1U77BX9IYsn90pd&ved=2ahUKEwjm8rDNn5-RAxW3gf0HHVwrAOM4ChDy0wN6BAgJEAQ"
          },
          {
            "page": 3,
            "link": "https://google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bgkvaeaDJreD9u8P3NaAmA4&start=20&sa=N&sstk=Af77f_eFZKVsAhGpqtW7LYUCiyTrrgz-wDe_nPDde0YRsf-YpN3QJxkoJNFjPlErT056UQYQR4De5lpy6XtWqk6piHf9Glbq3o1K9ojzdKQbPjfs5KzJo1U77BX9IYsn90pd&ved=2ahUKEwjm8rDNn5-RAxW3gf0HHVwrAOM4ChDy0wN6BAgJEAc"
          },
          {
            "page": 4,
            "link": "https://google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bgkvaeaDJreD9u8P3NaAmA4&start=30&sa=N&sstk=Af77f_eFZKVsAhGpqtW7LYUCiyTrrgz-wDe_nPDde0YRsf-YpN3QJxkoJNFjPlErT056UQYQR4De5lpy6XtWqk6piHf9Glbq3o1K9ojzdKQbPjfs5KzJo1U77BX9IYsn90pd&ved=2ahUKEwjm8rDNn5-RAxW3gf0HHVwrAOM4ChDy0wN6BAgJEAk"
          },
          {
            "page": 5,
            "link": "https://google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bgkvaeaDJreD9u8P3NaAmA4&start=40&sa=N&sstk=Af77f_eFZKVsAhGpqtW7LYUCiyTrrgz-wDe_nPDde0YRsf-YpN3QJxkoJNFjPlErT056UQYQR4De5lpy6XtWqk6piHf9Glbq3o1K9ojzdKQbPjfs5KzJo1U77BX9IYsn90pd&ved=2ahUKEwjm8rDNn5-RAxW3gf0HHVwrAOM4ChDy0wN6BAgJEAs"
          },
          {
            "page": 6,
            "link": "https://google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bgkvaeaDJreD9u8P3NaAmA4&start=50&sa=N&sstk=Af77f_eFZKVsAhGpqtW7LYUCiyTrrgz-wDe_nPDde0YRsf-YpN3QJxkoJNFjPlErT056UQYQR4De5lpy6XtWqk6piHf9Glbq3o1K9ojzdKQbPjfs5KzJo1U77BX9IYsn90pd&ved=2ahUKEwjm8rDNn5-RAxW3gf0HHVwrAOM4ChDy0wN6BAgJEA0"
          },
          {
            "page": 7,
            "link": "https://google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bgkvaeaDJreD9u8P3NaAmA4&start=60&sa=N&sstk=Af77f_eFZKVsAhGpqtW7LYUCiyTrrgz-wDe_nPDde0YRsf-YpN3QJxkoJNFjPlErT056UQYQR4De5lpy6XtWqk6piHf9Glbq3o1K9ojzdKQbPjfs5KzJo1U77BX9IYsn90pd&ved=2ahUKEwjm8rDNn5-RAxW3gf0HHVwrAOM4ChDy0wN6BAgJEA8"
          },
          {
            "page": 8,
            "link": "https://google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bgkvaeaDJreD9u8P3NaAmA4&start=70&sa=N&sstk=Af77f_eFZKVsAhGpqtW7LYUCiyTrrgz-wDe_nPDde0YRsf-YpN3QJxkoJNFjPlErT056UQYQR4De5lpy6XtWqk6piHf9Glbq3o1K9ojzdKQbPjfs5KzJo1U77BX9IYsn90pd&ved=2ahUKEwjm8rDNn5-RAxW3gf0HHVwrAOM4ChDy0wN6BAgJEBE"
          },
          {
            "page": 9,
            "link": "https://google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bgkvaeaDJreD9u8P3NaAmA4&start=80&sa=N&sstk=Af77f_eFZKVsAhGpqtW7LYUCiyTrrgz-wDe_nPDde0YRsf-YpN3QJxkoJNFjPlErT056UQYQR4De5lpy6XtWqk6piHf9Glbq3o1K9ojzdKQbPjfs5KzJo1U77BX9IYsn90pd&ved=2ahUKEwjm8rDNn5-RAxW3gf0HHVwrAOM4ChDy0wN6BAgJEBM"
          },
          {
            "page": 10,
            "link": "https://google.com/search?q=Habit+Tracker+Notion+Template&sca_esv=65d22011d5166a01&gl=us&hl=en&ei=bgkvaeaDJreD9u8P3NaAmA4&start=90&sa=N&sstk=Af77f_eFZKVsAhGpqtW7LYUCiyTrrgz-wDe_nPDde0YRsf-YpN3QJxkoJNFjPlErT056UQYQR4De5lpy6XtWqk6piHf9Glbq3o1K9ojzdKQbPjfs5KzJo1U77BX9IYsn90pd&ved=2ahUKEwjm8rDNn5-RAxW3gf0HHVwrAOM4ChDy0wN6BAgJEBU"
          }
        ],
        "api_pagination": {
          "next": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&antiBlockConfig=%5Bobject%20Object%5D&include_html=true&output=json&page=3",
          "other_pages": [
            {
              "page": 1,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&antiBlockConfig=%5Bobject%20Object%5D&include_html=true&output=json&page=1"
            },
            {
              "page": 3,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&antiBlockConfig=%5Bobject%20Object%5D&include_html=true&output=json&page=3"
            },
            {
              "page": 4,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&antiBlockConfig=%5Bobject%20Object%5D&include_html=true&output=json&page=4"
            },
            {
              "page": 5,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&antiBlockConfig=%5Bobject%20Object%5D&include_html=true&output=json&page=5"
            },
            {
              "page": 6,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&antiBlockConfig=%5Bobject%20Object%5D&include_html=true&output=json&page=6"
            },
            {
              "page": 7,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&antiBlockConfig=%5Bobject%20Object%5D&include_html=true&output=json&page=7"
            },
            {
              "page": 8,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&antiBlockConfig=%5Bobject%20Object%5D&include_html=true&output=json&page=8"
            },
            {
              "page": 9,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&antiBlockConfig=%5Bobject%20Object%5D&include_html=true&output=json&page=9"
            },
            {
              "page": 10,
              "link": "https://api.valueserp.com/search?api_key=BC0DE78CDA224510AEA6645023C80284&q=Habit%20Tracker%20Notion%20Template&gl=us&hl=en&google_domain=google.com&include_ai_overview=true&include_answer_box=true&antiBlockConfig=%5Bobject%20Object%5D&include_html=true&output=json&page=10"
            }
          ]
        },
        "from_sticky_session": true
      }
    ]
  }
};

            // --- 1. NORMALIZE SERP ITEMS ---
            // Luôn fallback mảng rỗng nếu không có organic_results
            const organicResults = apiData.organic_results || [];
            
            let pos = 0;
            let last = 0;
            const serpItems: SerpItem[] = organicResults.map(item => {
                if (item.position > pos) {
                    pos = item.position;
                    last = item.position;
                } else {
                    pos = last + item.position;
                }
 
                const { type, isWeak, scoreCategory } = categorizeDomain(item.domain, item.title);

                console.log(pos, last);

                return {
                    rank: pos < 10 ? `0${pos}` : pos,
                    domain: item.domain,
                    title: item.title,
                    url: item.link,
                    snippet: item.snippet,
                    tags: [type],
                    isWeakSpot: isWeak,
                    scoreCategory: scoreCategory,
                    displayed_link: item.displayed_link,
                };
            });

            // --- 2. EXTRACT SEEDING TARGETS ---
            const seedingTargets: SeedingTarget[] = [];
            const addedUrls = new Set<string>();

            // Nguồn A: Discussions Box (Nếu có)
            if (apiData.discussions_and_forums) {
                apiData.discussions_and_forums.forEach(d => {
                    const metaParts = [];
                    if (d.source?.comments_count) metaParts.push(d.source.comments_count);
                    if (d.source?.time) metaParts.push(d.source.time);

                    seedingTargets.push({
                        source: d.source?.source_title || 'Forum',
                        title: d.discussion_title,
                        url: d.link,
                        meta: metaParts.join(' • ') || 'Active Thread',
                        isHijackable: true
                    });
                    addedUrls.add(d.link);
                });
            }

            // Nguồn B: Quét Organic Results (Tìm Reddit/Quora ẩn trong Top 20)
            serpItems.forEach(item => {
                if (item.isWeakSpot && !addedUrls.has(item.url)) {
                    let sourceName = getBrandName(item.domain);


                    console.log(item);
                    console.log(extractMetaFromOrganic(item));
                    
                    seedingTargets.push({
                        source: sourceName,
                        title: item.title,
                        url: item.url,
                        meta: extractMetaFromOrganic(item),
                        isHijackable: true
                    });
                    addedUrls.add(item.url);
                }
            });

            // Nguồn C: People Also Ask Sources (Nếu link nguồn là Forum)
            if (apiData.related_questions) {
                apiData.related_questions.forEach(q => {
                    if (q.source && !addedUrls.has(q.source.link)) {
                        const { isWeak } = categorizeDomain(q.source.link, q.source.title);
                        if (isWeak) {
                            seedingTargets.push({
                                source: 'PAA Source',
                                title: q.question,
                                url: q.source.link,
                                meta: 'Featured Answer',
                                isHijackable: true
                            });
                            addedUrls.add(q.source.link);
                        }
                    }
                });
            }

            // --- 3. ANALYZE VERDICT ---
            const verdict = analyzeMarket(serpItems, seedingTargets);

            // --- 4. EXTRACT PIVOT IDEAS (Gom từ 4 nguồn) ---
            let rawIdeas: string[] = [];

            // Nguồn 1: Related Searches (Thường ở cuối)
            if (apiData.related_searches) {
                rawIdeas.push(...apiData.related_searches.map(s => s.query));
            }

            // Nguồn 2: People Also Ask (Nếu có)
            if (apiData.related_questions) {
                rawIdeas.push(...apiData.related_questions.map(q => q.question));
            }

            // Nguồn 3: Inline Videos Titles (Nếu có - Case Invoice Generator)
            if (apiData.inline_videos) {
                rawIdeas.push(...apiData.inline_videos.map(v => v.title));
            }

            // Nguồn 4: AI Overview Headers/Bold text (Nếu có - Case Habit Tracker)
            if (apiData.ai_overview?.ai_overview_contents) {
                apiData.ai_overview.ai_overview_contents.forEach(content => {
                    if (content.list) {
                        content.list.forEach(li => {
                            if (li.header) rawIdeas.push(li.header.replace(':', ''));
                        });
                    }
                    if (content.type === 'header' && content.text) {
                        rawIdeas.push(content.text);
                    }
                });
            }

            // Lọc trùng & lấy 8 ý tưởng ngon nhất
            const pivotIdeas = [...new Set(rawIdeas)]
                .filter(str => str && str.length < 70 && str.length > 5)
                .slice(0, 8);

            return { verdict, serpItems, seedingTargets, pivotIdeas };

        } catch (error) {
            console.error("Analysis Error:", error);
            // Có thể return dummy data hoặc throw để UI xử lý
            throw error;
        }
    };

    return {
        ...metaData,
        streamed: loadAnalysisData()
    };
};
