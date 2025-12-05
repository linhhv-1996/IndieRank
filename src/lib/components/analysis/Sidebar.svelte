<script lang="ts">
    import type { SeedingTarget, AppItem } from '$lib/types';
    import OwnershipCard from './OwnershipCard.svelte';
    import SeedingTargets from './SeedingTargets.svelte';
    import { slugify } from '$lib/utils';

    // Nhận thêm props mới
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
        <div class="bento-card p-4 border border-border bg-zinc-900/20">
            <h3 class="text-[11px] font-mono text-subtle uppercase tracking-widest mb-3 pl-1">
                Other Alternatives
            </h3>
            <div class="space-y-1">
                {#each alternatives as app}
                    <a href={app.url} target="_blank" rel="noopener noreferrer" class="group flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-all">
                        <div class="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                            <img src={getFavicon(app.domain)} alt="" class="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-medium text-zinc-400 group-hover:text-white truncate">{app.name}</span>
                                <span class="text-[11px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/if}

    {#if relatedSearches.length > 0}
        <div class="pt-2">
            <h3 class="text-[11px] font-mono text-subtle uppercase tracking-widest mb-3 pl-1">
                Related Topics
            </h3>
            <div class="flex flex-wrap gap-2">
                {#each relatedSearches as term}
                    <a href="/analyze/{country.toLowerCase()}/{slugify(term)}" class="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[11px] text-subtle hover:text-white hover:border-zinc-600 transition-colors truncate max-w-full block">
                        {term}
                    </a>
                {/each}
            </div>
        </div>
    {/if}

</aside>
