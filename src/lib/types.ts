// src/lib/types.ts

export interface RawSearchResult {
    position: number;
    title: string;
    link: string;
    domain: string;
    snippet: string;
    displayed_link?: string;
    rich_snippet?: {
        top?: {
            extensions?: string[];
            detected_extensions?: Record<string, any>;
        };
    };
}

export interface RawDiscussion {
    discussion_title: string;
    link: string;
    source: {
        source_title: string;
        comments_count?: string;
        time?: string;
    };
}

export interface RawAiOverviewContent {
    type: string;
    text?: string;
    list?: Array<{ header?: string; text?: string }>;
}

export interface RawAiOverview {
    ai_overview_contents?: RawAiOverviewContent[];
}

export interface RawRelatedQuestion {
    question: string;
    answer?: string;
    source?: {
        link: string;
        title: string;
    };
}

export interface RawInlineVideo {
    title: string;
    link?: string;
    length?: string;
    source?: string;
}

export interface RequestInfo {
    success: boolean;
    credits_used?: number;
    credits_remaining?: number;
    message?: string;
}

export interface RawApiResponse {
    request_info?: RequestInfo;
    search_parameters: { q: string; gl: string };
    organic_results?: RawSearchResult[];
    discussions_and_forums?: RawDiscussion[];
    ai_overview?: RawAiOverview;
    related_questions?: RawRelatedQuestion[];
    related_searches?: { query: string }[];
    inline_videos?: RawInlineVideo[];
}

// --- PROCESSED TYPES ---

export interface SeedingTarget {
    source: string;
    title: string;
    url: string;
    meta: string;
    isHijackable: boolean;
}

export interface Verdict {
    status: string;
    title: string;
    description: string;
    color: string;
}

export interface AppItem {
    name: string;
    domain: string;
    url: string;
    description: string;
    type: 'app' | 'template' | 'resource';
    pricingModel: string;
    features: string[];
    rating?: number;
    reviewCount?: string;
    ctaText: string;
    pros?: string;
    cons?: string;
    audience?: string; // Ví dụ: "For HR & Recruiters"
    platforms?: string[]; // Ví dụ: ["Web", "iOS", "Android"]
    use_cases?: string[]; // Ví dụ: ["Event Reg", "Employee Feedback"]

    isSponsor?: boolean;
    affiliateUrl?: string;
}

export interface AnalysisResult {
    verdict: Verdict;
    apps: AppItem[];
    seedingTargets: SeedingTarget[];
    pivotIdeas: string[];
    marketReport?: string; // <-- TRƯỜNG MỚI THÊM
}
