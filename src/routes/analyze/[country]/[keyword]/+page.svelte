<script lang="ts">
    import type { PageData } from './$types';
    import AppGrid from '$lib/components/analysis/AppGrid.svelte'; // <-- Component mới
    import Sidebar from '$lib/components/analysis/Sidebar.svelte'; // <-- Component cũ
    import { slugify } from '$lib/utils';

    export let data: PageData;
    $: ({ keyword, country, metaTitle, metaDesc, slug } = data);

    // --- CẤU HÌNH SPONSOR GIẢ LẬP (SLOT $1k) ---
    // Sau này fetch từ DB dựa trên keyword
    const sponsorData = {
        title: "Clockify - #1 Free Time Tracker",
        domain: "clockify.me",
        url: "https://clockify.me",
        snippet: "The most popular free time tracker for teams. Unlimited users, free forever. Track time across projects.",
        isSponsor: true
    };
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
        <p class="text-[11px] font-mono text-subtle uppercase tracking-[0.18em] mb-1">
            Curated Tools & Insights
        </p>
        <h1 class="text-2xl md:text-3xl font-semibold text-white mb-2 capitalize">
            {keyword}
        </h1>
        <div class="flex flex-wrap items-center gap-3 text-[11px] text-subtle font-mono">
            <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span> 
                Real-time analysis
            </span>
            <span>•</span>
            <span>Region: {country}</span>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div class="lg:col-span-8 space-y-8">
            {#await data.streamed}
                <div class="space-y-4 animate-pulse">
                    <div class="h-40 bg-zinc-800/50 rounded-2xl w-full border border-zinc-800"></div>
                    <div class="h-32 bg-zinc-800/50 rounded-2xl w-full border border-zinc-800"></div>
                    <div class="h-32 bg-zinc-800/50 rounded-2xl w-full border border-zinc-800"></div>
                </div>
            {:then result} 
                
                <AppGrid 
                    apps={result.apps} 
                    sponsor={sponsorData} 
                />

                <section class="mt-12 pt-8 border-t border-border">
                    <h3 class="text-sm font-medium text-white mb-4">Related Searches</h3>
                    <div class="flex flex-wrap gap-2.5">
                        {#each result.pivotIdeas as term}
                            <a href="/analyze/{country.toLowerCase()}/{slugify(term)}" class="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-subtle hover:text-white hover:border-accent/50 transition-colors">
                                {term}
                            </a>
                        {/each}
                    </div>
                </section>

            {:catch error}
                <div class="p-6 border border-red-500/20 bg-red-500/10 rounded-xl text-center">
                    <p class="text-red-400 text-sm">{error.message}</p>
                    <button class="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors" on:click={() => location.reload()}>
                        Try Again
                    </button>
                </div>
            {/await}
        </div>

        {#await data.streamed}
            <aside class="lg:col-span-4 space-y-6 sticky-sidebar animate-pulse">
                
                <div class="flex items-center justify-between">
                    <div class="h-7 w-1/3 bg-zinc-800/50 rounded-md"></div> <div class="h-6 w-20 bg-zinc-800/50 rounded-full"></div> </div>

                <div class="h-28 bg-zinc-800/50 rounded-2xl border border-zinc-800"></div>

                <div class="h-48 bg-zinc-800/50 rounded-2xl border border-zinc-800 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-zinc-700/20 rounded-full blur-xl"></div>
                </div>

                <div class="h-64 bg-zinc-800/50 rounded-2xl border border-zinc-800 space-y-4 p-4">
                    <div class="flex justify-between border-b border-zinc-700/50 pb-2">
                        <div class="h-3 w-24 bg-zinc-700/50 rounded"></div>
                        <div class="h-3 w-8 bg-zinc-700/50 rounded"></div>
                    </div>
                    {#each Array(4) as _}
                        <div class="flex gap-3">
                            <div class="w-8 h-8 rounded bg-zinc-700/30 shrink-0"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-3 w-3/4 bg-zinc-700/30 rounded"></div>
                                <div class="h-2 w-1/2 bg-zinc-700/20 rounded"></div>
                            </div>
                        </div>
                    {/each}
                </div>

            </aside>
        {:then result}
            <Sidebar verdict={result.verdict} targets={result.seedingTargets} />
        {/await}
    </div>
</div>
