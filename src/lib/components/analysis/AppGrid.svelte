<script lang="ts">
    import type { AppItem } from '$lib/types';
    export let apps: AppItem[] = [];
    export let sponsor: any = null;

    const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    
    // Badge style tối giản, border mỏng
    const getBadgeColor = (tag: string) => {
        const t = tag.toLowerCase();
        if (t.includes('free')) return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
        if (t.includes('top rated')) return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
        if (t.includes('open source')) return 'text-purple-400 border-purple-400/20 bg-purple-400/5';
        return 'text-zinc-400 border-zinc-700 bg-zinc-800/50';
    };

    const getDisplayTags = (app: AppItem) => {
        let tags = [];
        if (app.pricingModel && app.pricingModel !== 'Unknown') tags.push(app.pricingModel);
        tags = [...tags, ...app.features];
        return tags.slice(0, 3); // Lấy ít tag thôi cho thoáng
    };
</script>

<div class="w-full">
    <div class="flex items-center justify-between px-2 mb-3">
        <h2 class="text-xs font-mono font-medium text-subtle uppercase tracking-widest">Top Recommendations</h2>
        <span class="text-[10px] text-zinc-600 font-mono">
            {apps.length} items
        </span>
    </div>

    <div class="flex flex-col space-y-1">
        {#each apps as app}
            <a 
                href={app.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                class="group relative flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-zinc-800 hover:bg-zinc-900/60 transition-all duration-200 cursor-pointer"
            >
                <div class="shrink-0 w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden group-hover:border-zinc-700 transition-colors">
                    <img src={getFavicon(app.domain)} alt={app.name} class="w-5 h-5 object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>

                <div class="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                    
                    <div class="md:col-span-4 min-w-0">
                        <div class="flex items-center gap-2">
                            <h3 class="text-sm font-medium text-zinc-300 group-hover:text-white truncate transition-colors">
                                {app.name}
                            </h3>
                            {#if app.rating && app.rating >= 4.5}
                                <span class="text-[9px] text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/10">★ {app.rating}</span>
                            {/if}
                        </div>
                        <div class="text-[10px] text-zinc-600 font-mono truncate group-hover:text-zinc-500">
                            {app.domain}
                        </div>
                    </div>

                    <div class="md:col-span-5 hidden md:block">
                        <p class="text-xs text-zinc-500 group-hover:text-zinc-400 line-clamp-1 truncate transition-colors">
                            {app.description}
                        </p>
                    </div>

                    <div class="md:col-span-3 hidden md:flex justify-end gap-1.5">
                        {#each getDisplayTags(app) as tag}
                            <span class="text-[9px] px-1.5 py-0.5 rounded border {getBadgeColor(tag)} truncate max-w-[80px]">
                                {tag}
                            </span>
                        {/each}
                    </div>
                </div>

                <div class="shrink-0 pl-2">
                    <svg class="w-4 h-4 text-zinc-700 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"></path>
                    </svg>
                </div>
            </a>
        {/each}
    </div>

    {#if apps.length === 0}
        <div class="py-12 text-center border border-dashed border-zinc-800 rounded-lg">
            <p class="text-xs text-zinc-600 font-mono">No data found.</p>
        </div>
    {/if}
</div>
