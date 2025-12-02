// src/lib/types.ts

// --- RAW API TYPES (Cấu trúc trả về từ JSON) ---
export interface RawSearchResult {
    position: number;
    title: string;
    link: string;
    domain: string;
    snippet: string;
    displayed_link?: string;
    rich_snippet?: {
        top?: {
            extensions?: string[]; // Chứa "20 comments", "Free"
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

// Bổ sung interface cho request_info
export interface RequestInfo {
    success: boolean;
    credits_used?: number;
    credits_remaining?: number;
    message?: string; // Để hứng lỗi nếu có
}

export interface RawApiResponse {
    request_info?: RequestInfo; // <--- Thêm dòng này (để optional vì có thể case lỗi trả về khác)
    search_parameters: { q: string; gl: string };
    organic_results: RawSearchResult[];
    discussions_and_forums?: RawDiscussion[];
    related_searches?: { query: string }[];
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
