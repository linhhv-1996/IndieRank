<script lang="ts">
    // Mock data for SERP items
    const serpItems = [
        { rank: '01', domain: 'myhours.com', tags: ['Listicle', 'Top-of-funnel'], title: '17 Best Time Tracking Apps for 2025' },
        { rank: '02', domain: 'reddit.com', tags: ['Forum / Weak Spot', 'UGC'], title: 'Simple, Personal Time-Tracker : r/productivity', isWeakSpot: true, desc: '"WatchMe by flamebrain is the simplest and easiest..."' },
        { rank: '03', domain: 'play.google.com', tags: ['App Store', 'Direct product'], title: 'Simple Time Tracker - Apps on Google Play' },
        { rank: '04', domain: 'clockify.me', tags: ['Product', 'Freemium'], title: 'Clockify™ - FREE Time Tracking Software' },
        { rank: '05', domain: 'toggl.com', tags: ['Product', 'Team focus'], title: 'Toggl Track — Time Tracking for Teams & Individuals' },
        { rank: '06', domain: 'zapier.com', tags: ['Blog', 'Affiliate listicle'], title: 'The 10 best time tracking apps in 2025' },
        { rank: '07', domain: 'rescuetime.com', tags: ['Product', 'Behavioral'], title: 'RescueTime — Time Tracking & Focus Assistant' },
        { rank: '08', domain: 'quora.com', tags: ['Forum', 'Answer gap'], title: 'What is the best free time tracking app?' },
        { rank: '09', domain: 'notion.so', tags: ['Template', 'DIY users'], title: 'Personal time tracking dashboard (Notion template)' },
        { rank: '10', domain: 'medium.com', tags: ['Blog', 'Indie story'], title: 'How I finally stuck to time tracking as a solo dev' },
    ];
</script>

<section class="bento-card p-0 overflow-hidden">
    <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-card/90">
        <h3 class="text-sm font-medium text-white">SERP Landscape (Top 10)</h3>
        <span class="text-[10px] text-subtle font-mono">Source: Google (US)</span>
    </div>
    <div class="divide-y divide-border">
        {#each serpItems as item}
            <div class="px-6 py-3.5 group serp-row {item.isWeakSpot ? 'bg-accent/6 relative' : ''}">
                {#if item.isWeakSpot}
                    <div class="absolute left-0 top-0 bottom-0 w-[2px] bg-accent"></div>
                {/if}
                <div class="flex items-start gap-4">
                    <span class="font-mono text-xs {item.isWeakSpot ? 'text-accent' : 'text-subtle'} w-6 pt-1">{item.rank}</span>
                    <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1">
                            <span class="text-[10px] font-mono {item.isWeakSpot ? 'text-accent' : 'text-subtle'} truncate max-w-[150px]">{item.domain}</span>
                            {#each item.tags as tag}
                                <span class="text-[9px] {item.isWeakSpot && tag.includes('Weak Spot') ? 'bg-accent/25 text-accent font-bold' : (item.isWeakSpot ? 'border border-accent/40 text-accent' : 'border border-border text-subtle')} px-1.5 py-0.5 rounded-full">
                                    {tag}
                                </span>
                            {/each}
                        </div>
                        <a href="#" class="text-sm md:text-base {item.isWeakSpot ? 'text-white font-medium' : 'text-gray-300'} truncate block serp-title">
                            {item.title}
                        </a>
                        {#if item.desc}
                            <p class="text-xs md:text-sm text-subtle mt-1 line-clamp-1">{item.desc}</p>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
</section>
