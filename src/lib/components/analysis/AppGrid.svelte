<script lang="ts">
    import type { AppItem } from '$lib/types';
    export let apps: AppItem[] = [];
    export let sponsor: any = null;

    const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    
    // Helper màu cho badge
    const getBadgeColor = (tag: string) => {
        const t = tag.toLowerCase();
        if (t.includes('free')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (t.includes('top rated')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        if (t.includes('open source')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        if (t.includes('for teams')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    };

    // Helper tags
    const getDisplayTags = (app: AppItem) => {
        let tags = [];
        if (app.pricingModel && app.pricingModel !== 'Unknown') tags.push(app.pricingModel);
        if (app.audience) tags.push(app.audience);
        tags = [...tags, ...app.features];
        if (tags.length === 0) tags.push(app.type === 'app' ? 'Software' : 'Resource');
        return tags.slice(0, 4);
    };

    $: featuredApps = apps.filter(a => a.type === 'app' || (a.rating && a.rating > 0));
    $: otherApps = apps.filter(a => !featuredApps.includes(a));
</script>

<div class="space-y-8">
    
    <div>
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-white">Top Market Leaders</h2>
        </div>

        <div class="grid grid-cols-1 gap-3">
            {#each featuredApps as app}
                <a href={app.url} target="_blank" rel="noopener noreferrer" class="bento-card p-4 group hover:border-zinc-500 transition-all block bg-card/80 flex flex-col h-full">
                    
                    <div class="flex items-start gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 p-1.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                            <img src={getFavicon(app.domain)} alt={app.name} class="w-full h-full object-contain opacity-90" />
                        </div>

                        <div class="flex-1 min-w-0 flex justify-between items-start gap-2">
                            <div class="flex flex-col">
                                <div class="flex items-center gap-2">
                                    <h3 class="text-sm md:text-base font-bold text-gray-100 group-hover:text-accent transition-colors truncate">
                                        {app.name}
                                    </h3>
                                    {#if app.rating}
                                        <div class="flex items-center gap-0.5 text-yellow-400 text-[10px] font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/10 shrink-0">
                                            <span>★</span> {app.rating}
                                        </div>
                                    {/if}
                                </div>
                                <div class="text-[10px] text-zinc-500 truncate font-mono">{app.domain}</div>
                            </div>

                            <div class="shrink-0">
                                <span class="flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-700 bg-zinc-800/50 text-subtle group-hover:text-white group-hover:border-zinc-500 transition-colors">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                </span>
                            </div>
                        </div>
                    </div>

                    <p class="text-xs sm:text-sm text-subtle leading-relaxed line-clamp-2 mb-4 flex-grow group-hover:text-zinc-300 transition-colors">
                        {app.description}
                    </p>

                    <div class="flex flex-wrap items-center gap-2 mt-auto">
                        {#each getDisplayTags(app) as tag}
                            <span class="px-2 py-0.5 rounded-[4px] text-[10px] font-medium border {getBadgeColor(tag)}">
                                {tag}
                            </span>
                        {/each}
                    </div>
                </a>
            {/each}
        </div>
    </div>

    {#if otherApps.length > 0}
        <div class="pt-6 border-t border-dashed border-zinc-800">
            <div class="flex items-center gap-2 mb-3 pl-1">
                <h3 class="text-xs font-mono text-subtle uppercase tracking-widest">Alternatives</h3>
                <span class="text-[9px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-subtle">{otherApps.length}</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {#each otherApps as app}
                    <a href={app.url} target="_blank" rel="noopener noreferrer" class="group p-3 rounded-lg border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-800 hover:border-zinc-600 transition-all flex items-center gap-3">
                        <div class="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                            <img src={getFavicon(app.domain)} alt="" class="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex justify-between items-center">
                                <h4 class="text-xs font-semibold text-zinc-300 group-hover:text-white truncate">{app.name}</h4>
                                <span class="text-[10px] text-zinc-600 group-hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                            </div>
                            <p class="text-[10px] text-zinc-500 truncate">{app.domain}</p>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/if}

    {#if apps.length === 0}
        <div class="py-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
            <span class="text-2xl grayscale opacity-50 mb-2 block">📡</span>
            <p class="text-subtle text-sm">Scanning market data...</p>
        </div>
    {/if}
</div>
