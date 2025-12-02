<script lang="ts">
    import type { PageData } from './$types';
    import MarketVerdict from '$lib/components/analysis/MarketVerdict.svelte';
    import SeedingTargets from '$lib/components/analysis/SeedingTargets.svelte';
    import SerpList from '$lib/components/analysis/SerpList.svelte';
    import Sidebar from '$lib/components/analysis/Sidebar.svelte';

    export let data: PageData;

    // Destructure dữ liệu tĩnh (Có ngay lập tức)
    $: ({ keyword, country, metaTitle, metaDesc, slug } = data);
</script>

<svelte:head>
    <title>{metaTitle}</title>
    <meta name="description" content={metaDesc} />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href={`https://nicheradar.com/analyze/${country.toLowerCase()}/${slug}`} />
</svelte:head>

<div class="max-w-custom mx-auto px-4 md:px-6 py-8 w-full">
    <div class="mb-3">
        <a href="/" class="inline-flex items-center gap-2 text-[11px] font-mono text-subtle hover:text-white transition-colors">
            <span class="flex items-center justify-center w-5 h-5 rounded-full border border-border bg-card">←</span>
            <span>Back to Home</span>
        </a>
    </div>

    <div class="mb-8">
        <!-- <h1 class="text-2xl md:text-3xl font-semibold text-white mb-2 capitalize">
            {keyword}
        </h1> -->
        <p class="text-[11px] font-mono text-subtle uppercase tracking-[0.18em] mb-1">
            Niche Reconnaissance Report
        </p>
        <h1 class="text-2xl md:text-3xl font-semibold text-white mb-2 capitalize">
            "{keyword}"
        </h1>

        <div class="flex flex-wrap items-center gap-3 text-[11px] text-subtle font-mono">
            <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span> 
                Live Analysis
            </span>
            <span>•</span>
            <span>Region: {country}</span>
            <span>•</span>
            <span>Source: Google (Real-time)</span>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div class="lg:col-span-8 space-y-8">
            
            {#await data.streamed}
                <div class="space-y-8 animate-pulse">
                    
                    <div class="bento-card p-6 h-[220px] flex flex-col justify-between border-zinc-800/50 bg-card/50">
                        <div class="flex justify-between items-start">
                            <div class="h-3 w-24 bg-zinc-800 rounded"></div>
                            <div class="h-5 w-32 bg-zinc-800 rounded-full"></div>
                        </div>
                        <div class="space-y-3">
                            <div class="h-8 w-48 bg-zinc-800 rounded"></div>
                            <div class="space-y-2">
                                <div class="h-3 w-full max-w-lg bg-zinc-800/60 rounded"></div>
                                <div class="h-3 w-3/4 bg-zinc-800/60 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div class="bento-card overflow-hidden border-zinc-800/50 bg-card/50">
                        <div class="px-6 py-4 border-b border-zinc-800/50 flex justify-between items-center">
                            <div class="space-y-2">
                                <div class="h-4 w-32 bg-zinc-800 rounded"></div>
                                <div class="h-2 w-48 bg-zinc-800/60 rounded"></div>
                            </div>
                            <div class="h-5 w-16 bg-zinc-800 rounded-full"></div>
                        </div>
                        <div class="divide-y divide-zinc-800/50">
                            {#each Array(2) as _}
                            <div class="px-6 py-4 flex items-start gap-4">
                                <div class="w-6 h-6 bg-zinc-800 rounded-full shrink-0"></div>
                                <div class="flex-1 space-y-2">
                                    <div class="flex gap-2">
                                        <div class="h-3 w-16 bg-zinc-800 rounded"></div>
                                        <div class="h-3 w-12 bg-zinc-800/60 rounded"></div>
                                    </div>
                                    <div class="h-4 w-3/4 bg-zinc-800 rounded"></div>
                                </div>
                            </div>
                            {/each}
                        </div>
                    </div>

                    <div class="bento-card overflow-hidden border-zinc-800/50 bg-card/50">
                        <div class="px-6 py-4 border-b border-zinc-800/50">
                            <div class="h-4 w-40 bg-zinc-800 rounded"></div>
                        </div>
                        <div class="divide-y divide-zinc-800/50">
                            {#each Array(5) as _}
                            <div class="px-6 py-4 flex items-start gap-4">
                                <div class="w-6 h-4 bg-zinc-800 rounded mt-1"></div>
                                <div class="flex-1 space-y-2">
                                    <div class="flex gap-2 mb-1">
                                        <div class="h-2 w-20 bg-zinc-800/60 rounded"></div>
                                        <div class="h-2 w-12 bg-zinc-800/60 rounded"></div>
                                    </div>
                                    <div class="h-4 w-2/3 bg-zinc-800 rounded"></div>
                                    <div class="h-2 w-full max-w-md bg-zinc-800/40 rounded"></div>
                                </div>
                            </div>
                            {/each}
                        </div>
                    </div>

                </div>

            {:then result} 
                <MarketVerdict verdict={result.verdict} />

                <SeedingTargets targets={result.seedingTargets} />

                <SerpList items={result.serpItems} />

                <section class="bento-card p-6">
                    <h3 class="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        Pivot Ideas <span class="text-xs font-normal text-subtle">(Related Searches)</span>
                    </h3>
                    <div class="flex flex-wrap gap-2.5">
                        {#each result.pivotIdeas as term}
                            <a 
                                href="/analyze/{country.toLowerCase()}/{term.replace(/\s+/g, '-').replace(/[^\w-]/g, '').toLowerCase()}" 
                                class="px-4 py-2 bg-card border border-border hover:border-accent/40 hover:bg-zinc-800 rounded-full text-xs md:text-sm text-gray-300 hover:text-white transition-all"
                            >
                                {term}
                            </a>
                        {/each}
                    </div>
                </section>

                <section class="bento-card p-5 border border-border bg-card/90">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <p class="text-[10px] font-mono text-subtle uppercase tracking-[0.18em] mb-1">Quick Action</p>
                            <h3 class="text-sm font-semibold text-white">Export Analysis</h3>
                        </div>
                        <div class="w-8 h-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center">
                            <span class="text-xs">✨</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <button class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-black text-[11px] font-mono hover:bg-emerald-400 font-medium transition-colors">
                            <span>Copy context</span>
                        </button>
                        <button class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-[11px] font-mono text-subtle hover:text-white hover:bg-zinc-800 transition-colors">
                            <span>Save Report</span>
                        </button>
                    </div>
                </section>

            {:catch error}
                <div class="p-8 border border-red-500/20 bg-red-500/10 rounded-2xl text-center">
                    <p class="text-red-400 font-medium mb-2">Analysis Failed</p>
                    <p class="text-xs text-red-400/70 mb-4">{error.message}</p>
                    <button 
                        class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-mono transition-colors"
                        on:click={() => location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            {/await}
        </div>

        <Sidebar />
    </div>
</div>
