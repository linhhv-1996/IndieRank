<script lang="ts">
    import type { AppItem } from '$lib/types';
    export let apps: AppItem[] = [];
    export let sponsor: any = null;

    const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    
    // Đã sửa lại màu tag cho contrast tốt hơn (Đã chốt)
    const getBadgeColor = (tag: string) => {
        const t = tag.toLowerCase();
        if (t.includes('free')) return 'text-emerald-300 border-emerald-500/40 bg-emerald-700/25';
        if (t.includes('top rated')) return 'text-amber-300 border-amber-500/40 bg-amber-700/25';
        if (t.includes('open source')) return 'text-purple-300 border-purple-500/40 bg-purple-700/25';
        return 'text-zinc-300 border-zinc-700 bg-zinc-800/80';
    };

    const getDisplayTags = (app: AppItem) => {
        let tags = [];
        if (app.pricingModel && app.pricingModel !== 'Unknown') tags.push(app.pricingModel);
        tags = [...tags, ...app.features];
        
        if (tags.length === 0) {
            tags.push(app.type === 'app' ? 'Software' : 'Resource');
        }
        
        return tags.slice(0, 4); // Cho 4 tags để lấp đầy không gian ở dưới
    };
</script>

<div class="w-full">
    <div class="flex items-center justify-between px-1 mb-3">
        <h2 class="text-[11px] font-mono font-medium text-subtle uppercase tracking-widest">
            Market Leaders
        </h2>
        <span class="text-[10px] text-zinc-500 font-mono bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800">
            {apps.length} Results
        </span>
    </div>

    <div class="flex flex-col gap-2">
        {#each apps as app}
            <a 
                href={app.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                class="
                    group relative flex flex-col gap-3 p-4 rounded-xl
                    border border-zinc-800/60 bg-zinc-900/20 
                    hover:bg-zinc-800/40 hover:border-zinc-700
                    transition-all duration-200 cursor-pointer
                "
            >
                
                <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-3">
                        <div class="shrink-0 w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center justify-center overflow-hidden transition-colors shadow-sm">
                            <img src={getFavicon(app.domain)} alt={app.name} class="w-6 h-6 object-contain opacity-90" />
                        </div>
                        
                        <div class="min-w-0 flex flex-col">
                            <div class="flex items-center gap-2">
                                <h3 class="text-sm font-medium text-zinc-200 group-hover:text-white truncate transition-colors">
                                    {app.name}
                                </h3>
                                {#if app.rating && app.rating >= 4.5}
                                    <div class="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-amber-400/5 px-1.5 py-0.5 rounded border border-amber-400/15">
                                        ★ {app.rating}
                                    </div>
                                {/if}
                            </div>
                            <div class="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                                {app.domain}
                            </div>
                        </div>
                    </div>
                    
                    <div class="shrink-0 pt-1">
                        <span class="text-zinc-700 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200 text-sm">
                            →
                        </span>
                    </div>
                </div>

                <div class="space-y-3 pl-13"> 
                    
                    <p class="text-xs text-zinc-400 group-hover:text-zinc-300 line-clamp-2 leading-snug transition-colors">
                        {app.description}
                    </p>

                    <div class="flex flex-wrap items-center gap-2">
                        {#each getDisplayTags(app) as tag}
                            <span class="text-[9px] px-2 py-0.5 rounded-md border font-medium {getBadgeColor(tag)} transition-colors">
                                {tag}
                            </span>
                        {/each}
                    </div>
                </div>
            </a>
        {/each}
    </div>

    {#if apps.length === 0}
        <div class="py-16 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
            <span class="text-2xl opacity-20 mb-2">∅</span>
            <p class="text-xs text-zinc-600 font-mono">Scanning for opportunities...</p>
        </div>
    {/if}
</div>

<style>
    /* CSS để căn chỉnh lề cho Description & Tags bằng kích thước của Icon (w-10 + gap-3 = 10px*4 + 12px = 52px) */
    .pl-13 {
        padding-left: 52px;
    }
</style>
