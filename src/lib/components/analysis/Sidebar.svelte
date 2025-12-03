<script lang="ts">
    import type { Verdict, SeedingTarget } from '$lib/types';
    import ExportActions from './ExportActions.svelte';
    import MarketVerdict from './MarketVerdict.svelte';
    import OwnershipCard from './OwnershipCard.svelte';
    import SeedingTargets from './SeedingTargets.svelte';

    export let verdict: Verdict;
    export let targets: SeedingTarget[];
</script>

<aside class="lg:col-span-4 space-y-6 sticky-sidebar">
    
    <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-white">Analytics</h2>
        
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-subtle">
            <span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
            FOR BUILDERS
        </span>
    </div>

    <OwnershipCard />

    <div class="shadow-xl">
        <MarketVerdict {verdict} />
    </div>

    <div class="bento-card border border-border bg-card/80">
        <SeedingTargets {targets} />
    </div>
    <ExportActions {verdict} {targets} />

</aside>
