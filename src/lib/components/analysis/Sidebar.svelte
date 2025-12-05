<script lang="ts">
    import type { SeedingTarget, AppItem } from '$lib/types';
    import OwnershipCard from './OwnershipCard.svelte';
    import SeedingTargets from './SeedingTargets.svelte';
    import { slugify } from '$lib/utils';

    export let targets: SeedingTarget[] = [];
    export let alternatives: AppItem[] = [];
    export let relatedSearches: string[] = [];
    export let country: string = 'us';

    const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
</script>

<aside class="lg:col-span-4 space-y-5 sticky-sidebar">
    
    <OwnershipCard />

    <div class="bento-card border border-border bg-card/80">
        <SeedingTargets {targets} />
    </div>

    {#if alternatives.length > 0}
        <div class="bento-card border border-zinc-800/60 bg-zinc-900/20 p-0 overflow-hidden">
            
            <div class="px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/50">
                <h3 class="text-[11px] font-mono text-subtle uppercase tracking-widest">
                    Other Alternatives ({alternatives.length})
                </h3>
            </div>

            <div class="divide-y divide-zinc-800">
                {#each alternatives as app}
                    <a href={app.url} target="_blank" rel="noopener noreferrer" class="
                        group flex items-center gap-3 px-4 py-2.5 
                        hover:bg-zinc-800/50 transition-all duration-200
                    ">
                        <div class="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            <img src={getFavicon(app.domain)} alt="" class="w-4 h-4 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                        
                        <div class="min-w-0 flex-1">
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-medium text-zinc-300 group-hover:text-white truncate">
                                    {app.name}
                                </span>
                                <span class="text-[10px] text-zinc-600 font-mono opacity-80 group-hover:opacity-100 transition-opacity">
                                    {app.domain}
                                </span>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/if}

    {#if relatedSearches.length > 0}
        <div class="pt-2">
            <h3 class="text-[10px] font-mono text-subtle uppercase tracking-widest mb-3 pl-1">
                Related Topics
            </h3>
            <div class="flex flex-wrap gap-2">
                {#each relatedSearches as term}
                    <a href="/analyze/{country.toLowerCase()}/{slugify(term)}" class="
                        px-2.5 py-1 rounded-md text-[10px] 
                        bg-zinc-900 border border-zinc-800 
                        text-subtle hover:text-white hover:border-zinc-600 
                        transition-colors truncate max-w-full block font-mono
                    ">
                        {term}
                    </a>
                {/each}
            </div>
        </div>
    {/if}
</aside>
