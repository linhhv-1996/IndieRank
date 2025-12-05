<script lang="ts">
    import type { PageData } from './$types';
    import AppGrid from '$lib/components/analysis/AppGrid.svelte';
    import Sidebar from '$lib/components/analysis/Sidebar.svelte';

    export let data: PageData;
    $: ({ keyword, country, metaTitle, metaDesc, slug } = data);

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
            AI-Powered Buying Guide & Reviews
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

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div class="lg:col-span-8 space-y-8">
            {#await data.streamed}
                <div class="space-y-4 animate-pulse">
                    <div class="h-32 bg-zinc-900/50 border border-zinc-800 rounded-xl w-full mb-6"></div>
                    <div class="h-40 bg-zinc-800/50 rounded-2xl w-full border border-zinc-800"></div>
                    <div class="h-32 bg-zinc-800/50 rounded-2xl w-full border border-zinc-800"></div>
                </div>
            {:then result} 
                {@const featuredApps = result.apps.filter(a => a.type === 'app' || (a.rating && a.rating > 0))}
                {@const alternatives = result.apps.filter(a => !featuredApps.includes(a))}

                {#if result.marketReport}
                    <section class="relative overflow-hidden rounded-xl border border-accent/20 bg-zinc-900/40 p-5">
                        <div class="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-accent/10 blur-3xl rounded-full pointer-events-none"></div>
                        <div class="relative z-10">
                            <div class="flex items-center gap-2.5 mb-3">
                                <div class="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-sm">⚡</div>
                                <h3 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Quick Buying Guide</h3>
                            </div>
                            <div class="text-xs text-subtle leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-white [&_strong]:font-medium [&_strong]:text-accent">
                                {@html result.marketReport}
                            </div>
                        </div>
                    </section>
                {/if}

                <AppGrid apps={featuredApps} sponsor={sponsorData} />

            {:catch error}
                <div class="p-6 border border-red-500/20 bg-red-500/10 rounded-xl text-center">
                    <p class="text-red-400 text-sm">{error.message}</p>
                    <button class="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors" on:click={() => location.reload()}>Try Again</button>
                </div>
            {/await}
        </div>

        {#await data.streamed}
            <aside class="lg:col-span-4 space-y-6 sticky-sidebar animate-pulse">
                <div class="h-28 bg-zinc-800/50 rounded-2xl border border-zinc-800"></div>
                <div class="h-64 bg-zinc-800/50 rounded-2xl border border-zinc-800"></div>
            </aside>
        {:then result}
            {@const featuredAppsSidebar = result.apps.filter(a => a.type === 'app' || (a.rating && a.rating > 0))}
            {@const alternativesSidebar = result.apps.filter(a => !featuredAppsSidebar.includes(a))}
            
            <Sidebar 
                targets={result.seedingTargets} 
                alternatives={alternativesSidebar}
                relatedSearches={result.pivotIdeas}
                {country}
            />
        {/await}
    </div>
</div>
