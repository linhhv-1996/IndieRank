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
            extensions?: string[]; // "20 comments", "Free"
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

// Bổ sung interface cho request_info
export interface RequestInfo {
    success: boolean;
    credits_used?: number;
    credits_remaining?: number;
    message?: string;
}

export interface RawApiResponse {
    request_info?: RequestInfo;
    search_parameters: { q: string; gl: string };
    
    // Tất cả các trường dữ liệu đều có thể thiếu
    organic_results?: RawSearchResult[];
    discussions_and_forums?: RawDiscussion[];
    ai_overview?: RawAiOverview;
    related_questions?: RawRelatedQuestion[];
    related_searches?: { query: string }[];
    inline_videos?: RawInlineVideo[];
}

// --- PROCESSED TYPES (Dữ liệu sạch cho Frontend) ---
export interface SerpItem {
    rank: string;
    domain: string;
    title: string;
    url: string;
    snippet: string;
    tags: string[];
    isWeakSpot: boolean;
    scoreCategory?: 'ULTRA' | 'WEAK' | 'HARD' | 'NORMAL';
    displayed_link: string;
}

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

export interface AnalysisResult {
    verdict: Verdict;
    serpItems: SerpItem[];
    seedingTargets: SeedingTarget[];
    pivotIdeas: string[];
}

