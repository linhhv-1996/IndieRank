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
            extensions?: string[]; // VD: ["4.5(2,550)", "Free", "iOS"]
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

// --- PROCESSED TYPES (Dữ liệu sạch cho Frontend) ---

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
    color: 'green' | 'red' | 'yellow';
}

// Interface App được nâng cấp
export interface AppItem {
    // Core Data (Luôn có)
    name: string;
    domain: string;
    url: string;
    description: string;
    
    // Phân loại
    type: 'app' | 'template' | 'resource';
    pricingModel: 'Free' | 'Freemium' | 'Paid' | 'Unknown';
    features: string[]; // VD: ["iOS", "Open Source", "No Credit Card"]
    
    // Social Proof (Có thể null)
    rating?: number;        // 4.5
    reviewCount?: string;   // "2.5k"
    
    // UX
    ctaText: string;        // "Get App", "Read Guide"
    audience?: string;      // "Best for Teams", "Solo Friendly"
}

export interface AnalysisResult {
    verdict: Verdict;
    apps: AppItem[];
    seedingTargets: SeedingTarget[];
    pivotIdeas: string[];
}
