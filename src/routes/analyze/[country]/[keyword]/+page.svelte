<script lang="ts">
    import type { PageData } from './$types';
    import AppGrid from '$lib/components/analysis/AppGrid.svelte';
    import Sidebar from '$lib/components/analysis/Sidebar.svelte';

    export let data: PageData;
    $: ({ keyword, country, metaTitle, metaDesc, slug } = data);
    
    let reportData: any = null;
    $: if (data.streamed) {
        data.streamed.then(res => {
            if (res.marketReport) {
                try {
                    reportData = JSON.parse(res.marketReport);
                } catch (e) { console.log('Legacy report'); }
            }
        });
    }

    const sponsorData = {
        title: "Clockify - #1 Free Time Tracker",
        domain: "clockify.me",
        url: "https://clockify.me",
        snippet: "The most popular free time tracker for teams. Unlimited users, free forever.",
        isSponsor: true
    };
</script>

<svelte:head>
    <title>{metaTitle}</title>
    <meta name="description" content={metaDesc} />
</svelte:head>

<div class="max-w-custom mx-auto px-4 md:px-6 py-8 w-full">
    <div class="mb-8">
        <a href="/" class="inline-flex items-center gap-2 text-[11px] font-mono text-subtle hover:text-white transition-colors mb-4">
            <span class="flex items-center justify-center w-5 h-5 rounded-full border border-border bg-card">←</span>
            <span>Back</span>
        </a>
        <h1 class="text-3xl md:text-4xl font-bold text-white capitalize tracking-tight mb-2">{keyword}</h1>
        <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p class="text-xs text-subtle font-mono uppercase tracking-wider">Live Analysis • {country}</p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div class="lg:col-span-8 space-y-8">
            {#await data.streamed}
                <div class="animate-pulse space-y-8">
                    
                    <!-- 1. Hero Card Skeleton -->
                    <div class="w-full h-[190px] rounded-xl border border-zinc-800 bg-zinc-900/30 flex overflow-hidden">
                        <!-- Left Badge -->
                        <div class="w-24 shrink-0 border-r border-zinc-800/50 bg-zinc-900/50 flex flex-col items-center justify-center gap-2">
                            <div class="w-10 h-10 rounded-full bg-zinc-800"></div>
                            <div class="w-12 h-2 bg-zinc-800 rounded"></div>
                        </div>
                        <!-- Middle Content -->
                        <div class="flex-1 p-5 flex flex-col justify-center gap-4">
                            <div class="flex items-center gap-3">
                                <div class="h-6 w-40 bg-zinc-800 rounded"></div>
                                <div class="h-5 w-20 bg-zinc-800/60 rounded"></div>
                            </div>
                            <div class="space-y-2">
                                <div class="h-3 w-full bg-zinc-800/40 rounded"></div>
                                <div class="h-3 w-2/3 bg-zinc-800/40 rounded"></div>
                            </div>
                            <div class="flex gap-2">
                                <div class="h-4 w-16 bg-zinc-800/40 rounded"></div>
                                <div class="h-4 w-16 bg-zinc-800/40 rounded"></div>
                            </div>
                        </div>
                        <!-- Right Score -->
                        <div class="w-40 shrink-0 border-l border-zinc-800/50 p-5 flex flex-col items-center justify-center gap-3 bg-zinc-900/20">
                            <div class="h-8 w-14 bg-zinc-800 rounded"></div>
                            <div class="h-9 w-full bg-zinc-800 rounded-lg"></div>
                        </div>
                    </div>

                    <!-- 2. List Skeleton -->
                    <div class="space-y-3">
                        <div class="flex justify-between items-center px-1 mb-2">
                            <div class="h-3 w-24 bg-zinc-800 rounded"></div>
                            <div class="h-3 w-16 bg-zinc-800 rounded"></div>
                        </div>
                        {#each Array(4) as _}
                            <div class="w-full h-24 rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-4 flex gap-4">
                                <div class="w-10 h-10 rounded-lg bg-zinc-800 shrink-0"></div>
                                <div class="flex-1 py-1 space-y-2.5">
                                    <div class="h-4 w-32 bg-zinc-800 rounded"></div>
                                    <div class="h-3 w-3/4 bg-zinc-800/40 rounded"></div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {:then result} 
                {@const featuredApps = result.apps.filter(a => a.type === 'app' || (a.rating && a.rating > 0))}
                


{#if reportData}
    {@const topApp = result.apps.find(a => a.name === reportData.editor_choice?.name) || result.apps[0]}
    
    <div class="relative w-full rounded-xl border border-amber-500/30 bg-[#0F0F10] overflow-hidden group hover:border-amber-500/50 transition-all duration-300 shadow-[0_4px_20px_-5px_rgba(245,158,11,0.1)] mb-6">
        
        <div class="absolute -left-10 top-0 bottom-0 w-32 bg-amber-500/10 blur-[40px] pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row items-stretch">
            
            <div class="flex md:flex-col items-center md:justify-center p-4 md:w-24 shrink-0 bg-amber-500/5 border-b md:border-b-0 md:border-r border-amber-500/10 gap-2">
                <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-lg shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    🏆
                </div>
                <span class="text-[9px] font-bold uppercase font-mono text-amber-500/90 tracking-widest text-center leading-tight">
                    Top<br>Pick
                </span>
            </div>

            <div class="flex-1 p-4 md:p-5 min-w-0 flex flex-col justify-center">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                    <h2 class="text-lg md:text-xl font-bold text-white truncate hover:text-amber-400 transition-colors">
                        <a href={topApp?.url} target="_blank">{reportData.editor_choice?.name}</a>
                    </h2>
                    
                    <span class="text-[9px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded">
                        Best Overall
                    </span>

                    {#if reportData.editor_choice?.best_for}
                        <span class="text-[9px] text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 truncate max-w-[150px]">
                            for {reportData.editor_choice.best_for}
                        </span>
                    {/if}
                </div>

                <p class="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                    {reportData.editor_choice?.summary}
                </p>

                {#if reportData.editor_choice?.pros?.length}
                    <div class="flex flex-wrap gap-x-4 gap-y-1">
                        {#each reportData.editor_choice.pros.slice(0, 3) as pro}
                            <div class="flex items-center gap-1.5">
                                <svg class="w-3 h-3 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                <span class="text-xs text-zinc-500">{pro}</span>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="p-4 md:p-5 md:w-48 shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-900/20">
                
                <div class="flex flex-col items-center">
                    <div class="flex items-end gap-1.5 leading-none mb-1.5">
                        <span class="text-2xl font-bold text-white">{reportData?.editor_choice?.rating}</span>
                        <span class="text-xs text-zinc-600 font-medium mb-0.5">/10</span>
                    </div>
                    <div class="flex gap-0.5">
                        {#each Array(5) as _, i}
                            <svg class="w-2.5 h-2.5 {i < Math.round(reportData?.editor_choice?.rating / 2) ? 'text-amber-500 fill-amber-500' : 'text-zinc-800 fill-zinc-800'}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        {/each}
                    </div>
                </div>

                <a href={topApp?.url} target="_blank" rel="noopener noreferrer" class="w-full text-center bg-white hover:bg-zinc-200 text-black text-xs font-bold py-2.5 px-4 rounded-lg transition-colors shadow-lg shadow-white/5 flex items-center justify-center gap-1.5 group/btn">
                    Visit Site
                    <svg class="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </a>
            </div>
        </div>

        <div class="bg-black/40 border-t border-amber-500/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-subtle">
            <div class="flex items-center gap-2 min-w-0">
                <span class="text-emerald-400 font-bold shrink-0">💰 Best Value:</span>
                <span class="text-zinc-300 truncate">{reportData.best_value?.name}</span>
                {#if reportData.best_value?.price_tag}
                    <span class="text-zinc-600 hidden sm:inline">({reportData.best_value.price_tag})</span>
                {/if}
            </div>
            
            {#if reportData.pro_tip}
                <div class="hidden md:flex items-center gap-2 max-w-[50%] min-w-0">
                    <span class="text-indigo-400 font-bold shrink-0">💡 Insight:</span>
                    <span class="text-zinc-400 truncate" title={reportData.pro_tip.content}>{reportData.pro_tip.title}</span>
                </div>
            {/if}
        </div>
    </div>

{:else if result.marketReport}
    <div class="p-5 border border-zinc-800 bg-zinc-900/30 rounded-xl text-xs text-subtle mb-6">
        {@html result.marketReport}
    </div>
{/if}

                

                <AppGrid apps={featuredApps} sponsor={sponsorData} />

            {:catch error}
                <div class="p-8 border border-red-500/10 bg-red-500/5 rounded-xl text-center">
                    <p class="text-red-400 text-sm">Could not generate analysis.</p>
                    <button class="mt-4 text-xs underline hover:text-white" on:click={() => location.reload()}>Try Again</button>
                </div>
            {/await}
        </div>

        {#await data.streamed}
            <aside class="lg:col-span-4 space-y-6 sticky-sidebar animate-pulse">
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
