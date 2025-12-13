<script lang="ts">
    import type { SeedingTarget, AppItem } from '$lib/types';
    import OwnershipCard from './OwnershipCard.svelte';
    import SeedingTargets from './SeedingTargets.svelte';
    import { slugify } from '$lib/utils';
    import AlternativesList from './AlternativesList.svelte';

    export let targets: SeedingTarget[] = [];
    export let alternatives: AppItem[] = [];
    export let relatedSearches: string[] = [];
    export let country: string = 'us';

    const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
</script>

<aside class="lg:col-span-4 space-y-5 sticky-sidebar">
    
    <!-- <OwnershipCard /> -->

    <div class="bento-card border border-border bg-card/80">
        <SeedingTargets {targets} />
    </div>

    <AlternativesList apps={alternatives} />

    
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
