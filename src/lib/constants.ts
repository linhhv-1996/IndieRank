// src/lib/constants.ts

export const DOMAIN_CATEGORIES = {
    // Seeding / Community (Weak Spot cũ)
    FORUM: [
        'reddit', 'quora', 'indiehackers', 'ycombinator', 
        'medium', 'dev.to', 'hashnode', 'producthunt', 
        'facebook', 'twitter', 'linkedin', 'pinterest',
        'tiktok', 'youtube', 'instagram', 'stackexchange', 'stackoverflow',
        'discord', 'slack'
    ],
    
    // Tài liệu công khai (Cơ hội cao)
    PUBLIC_DOC: [
        'docs.google.com', 'notion.site', 'dropbox.com', 'drive.google.com',
        'loom.com', 'trello.com', 'canva.com'
    ],

    // Đối thủ lớn (Khó nhai - nên né hoặc chỉ tham khảo)
    REVIEW: [
        'g2.com', 'capterra', 'trustradius', 'softwareadvice', 
        'getapp', 'trustpilot', 'financesonline', 'featuredcustomers', 'forbes.com'
    ],

    // Kho lưu trữ (Dev)
    TECH: [
        'github.com', 'npmjs.com', 'pypi.org', 'gitlab.com'
    ],

    // Báo chí / Tin tức (Data rác với end-user tìm tool, nên lọc bỏ)
    NEWS: [
        'nytimes.com', 'wsj.com', 'wikipedia.org', 'cafebiz.vn', 'vnexpress.net', 
        'techcrunch.com', 'theverge.com', 'businessinsider.com'
    ]
};

// Từ khóa để nhận diện loại sản phẩm trong Title/Snippet
export const PRODUCT_INTENT = {
    TEMPLATE: ['template', 'theme', 'kit', 'preset', 'dashboard', 'boilerplate', 'starter'],
    APP: ['software', 'app', 'tool', 'platform', 'download', 'pricing', 'generator', 'builder', 'api']
};
