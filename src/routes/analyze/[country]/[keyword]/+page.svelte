<script lang="ts">
    import type { PageData } from './$types';
    import AppGrid from '$lib/components/analysis/AppGrid.svelte';
    import Sidebar from '$lib/components/analysis/Sidebar.svelte';
    import ComparisonTable from '$lib/components/analysis/ComparisonTable.svelte';
    
    export let data: PageData;
    $: ({ keyword, country, marketReport, apps, seedingTargets, alternatives, pivotIdeas } = data);
    
    let reportData: any = null;
    
    // Parse Market Report (Chỉ còn best_value và pro_tip)
    $: if (marketReport) {
        try {
            reportData = JSON.parse(marketReport);
        } catch (e) {}
    }

    // Logic lọc top apps cho bảng so sánh
    $: compareList = apps.filter((app: { type: string; rating: number; pricingModel: string; }) => 
        app.type === 'app' && (app.rating > 0 || app.pricingModel !== 'Unknown')
    ).slice(0, 5);
</script>

<svelte:head>
    <title>Best {keyword} Tools & Alternatives</title>
</svelte:head>

<div class="max-w-custom mx-auto px-4 md:px-6 py-8 w-full">
    <div class="mb-8">
        <a href="/" class="text-[11px] text-subtle hover:text-white mb-4 block">← Back</a>
        <h1 class="text-3xl md:text-4xl font-bold text-white capitalize mb-2">{keyword}</h1>
        <div class="flex items-center gap-3 text-xs text-subtle font-mono">
            <span class="uppercase tracking-wider">Analysis • {country}</span>
            {#if reportData?.pro_tip}
                <span class="text-zinc-600">|</span>
                <span class="text-emerald-400">💡 Tip: {reportData.pro_tip.title}</span>
            {/if}
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-8 space-y-8">
            
            {#if compareList.length > 1}
                <!-- <div class="space-y-3">
                    <div class="flex items-center justify-between px-1">
                        <h2 class="text-[11px] font-mono font-medium text-subtle uppercase tracking-widest">
                            Quick Comparison
                        </h2>
                        {#if reportData?.best_value}
                            <div class="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">
                                <span>💰 Best Value:</span>
                                <span class="font-bold text-emerald-300">{reportData.best_value.name}</span>
                            </div>
                        {/if}
                    </div>
                    <ComparisonTable apps={compareList} />
                </div> -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between px-1">
                        
                        <div class="flex items-center gap-3">
                            <h2 class="text-[11px] font-mono font-medium text-subtle uppercase tracking-widest">
                                Quick Comparison
                            </h2>
                            {#if reportData?.best_value}
                                <div class="hidden sm:flex items-center gap-1.5 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">
                                    <span>💰 Best Value:</span>
                                    <span class="font-bold text-emerald-300">{reportData.best_value.name}</span>
                                </div>
                            {/if}
                        </div>

                        <div class="flex items-center gap-2 rounded border border-zinc-800 px-2 py-1 ">
                            
                            <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                                Sorted by Rating
                            </span>
                        </div>

                    </div>
                    
                    <ComparisonTable apps={compareList} />
                </div>
            {/if}

            <AppGrid {apps} />
        </div>

        <Sidebar 
            targets={seedingTargets} 
            {alternatives}
            relatedSearches={pivotIdeas}
            {country}
        />
    </div>
</div>
