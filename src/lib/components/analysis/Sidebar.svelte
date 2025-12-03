<script lang="ts">
    import type { Verdict, SeedingTarget } from '$lib/types';
    import MarketVerdict from './MarketVerdict.svelte';
    import SeedingTargets from './SeedingTargets.svelte';

    export let verdict: Verdict;
    export let targets: SeedingTarget[];
</script>

<aside class="lg:col-span-4 space-y-6 sticky-sidebar">
    
    <div class="shadow-xl">
        <MarketVerdict {verdict} />
    </div>

    <section class="bento-card p-5 border border-border/70 bg-card/80 hover:border-accent/50 cursor-pointer group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent"></div>
        <div class="relative z-10">
            <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono text-accent uppercase tracking-wider">Ownership</span>
                <span class="text-[10px] bg-accent/20 text-accent px-1.5 rounded">BETA</span>
            </div>
            <p class="text-sm font-semibold text-white mb-1 group-hover:text-accent transition-colors">
                Rent the #1 Slot on this keyword
            </p>
            <p class="text-xs text-subtle leading-relaxed">
                Get consistent traffic from people searching for this exact solution.
            </p>
        </div>
    </section>

    <div class="bento-card border border-border bg-card/80">
        <SeedingTargets {targets} />
    </div>

    <section class="bento-card p-5">
        <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] font-mono text-subtle uppercase tracking-[0.18em]">Build Stack</span>
        </div>
        </section>
</aside>
