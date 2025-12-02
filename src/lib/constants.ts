export const DOMAIN_KS = {
    // UGC/Forums: Rank đè được nếu content tốt, hoặc vào seeding (High Opportunity)
    SOCIAL_FORUMS: [
        'reddit', 'quora', 'indiehackers', 'ycombinator', 
        'medium', 'dev.to', 'hashnode', 'producthunt', 
        'facebook', 'twitter', 'linkedin', 'pinterest',
        'tiktok', 'youtube', 'instagram', 'stackexchange', 'stackoverflow'
    ],
    
    // Public Docs: Google "đói" content nên mới lôi mấy cái này lên (Ultra High Opportunity)
    PUBLIC_DOCS: [
        'docs.google.com', 'notion.site', 'dropbox.com', 'drive.google.com',
        'loom.com', 'trello.com', 'canva.com' // Canva view only links
    ],

    // Review Giants: Bọn này Domain Authority cực cao, content dày (Run Away)
    REVIEW_GIANTS: [
        'g2.com', 'capterra', 'trustradius', 'softwareadvice', 
        'getapp', 'trustpilot', 'financesonline', 'featuredcustomers', 'forbes.com'
    ],

    // Tech Giants: Github, NPM (Chỉ nên coi là tham khảo, khó beat nếu keyword là tên lib)
    TECH_GIANTS: [
        'github.com', 'npmjs.com', 'pypi.org'
    ]
};
