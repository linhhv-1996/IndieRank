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
                <div class="space-y-4 animate-pulse">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 h-[300px]">
                        <div class="md:col-span-7 bg-zinc-900/50 rounded-2xl border border-zinc-800"></div>
                        <div class="md:col-span-5 flex flex-col gap-4">
                            <div class="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800"></div>
                            <div class="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800"></div>
                        </div>
                    </div>
                </div>
            {:then result} 
                {@const featuredApps = result.apps.filter(a => a.type === 'app' || (a.rating && a.rating > 0))}
                
                {#if reportData}
                   
                
                <div class="bento-card bg-[#111113] border border-zinc-800 p-0 overflow-hidden relative group shadow-2xl">
                        
                        <div class="p-6 md:p-8 relative z-10">
                            <div class="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] pointer-events-none"></div>

                            <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div class="flex-1 min-w-0">
                                    <div class="flex flex-wrap items-center gap-3 mb-4">
                                        <span class="bg-[#FFB800] text-black text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide shadow-[0_0_15px_rgba(255,184,0,0.25)]">
                                            #1 Top Pick
                                        </span>
                                        {#if reportData.editor_choice?.best_for}
                                            <span class="text-[10px] font-mono text-amber-200/60 border border-amber-500/20 px-2.5 py-0.5 rounded-full bg-amber-500/5">
                                                Best for {reportData.editor_choice.best_for}
                                            </span>
                                        {/if}
                                    </div>

                                    <h2 class="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight group-hover:text-amber-50 transition-colors">
                                        {reportData.editor_choice?.name}
                                    </h2>
                                    
                                    <p class="text-sm text-zinc-300 leading-relaxed mb-5 font-medium border-l-2 border-amber-500/20 pl-3">
                                        "{reportData.editor_choice?.summary}"
                                    </p>

                                    {#if reportData.editor_choice?.pros && reportData.editor_choice.pros.length > 0}
                                        <div class="flex flex-wrap gap-x-6 gap-y-2">
                                            {#each reportData.editor_choice.pros as pro}
                                                <div class="flex items-center gap-2">
                                                    <div class="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                        <svg class="w-2.5 h-2.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                                    </div>
                                                    <span class="text-xs text-zinc-400">{pro}</span>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>

                                {#if reportData.editor_choice?.rating}
                                    <div class="shrink-0 flex flex-col items-center justify-center bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 min-w-[100px] backdrop-blur-sm self-start md:self-auto">
                                        <span class="text-3xl font-bold text-amber-400 leading-none mb-1.5">{reportData.editor_choice.rating}</span>
                                        <div class="flex gap-0.5 mb-1.5">
                                            {#each Array(5) as _, i}
                                                <svg class="w-2.5 h-2.5 {i < Math.round(reportData.editor_choice.rating / 2) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700 fill-zinc-700'}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                            {/each}
                                        </div>
                                        <span class="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Expert Score</span>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 border-t border-zinc-800 bg-zinc-900/30 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                            
                            <div class="p-5 flex items-start gap-4 hover:bg-zinc-900/50 transition-colors">
                                <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-lg">
                                    💰
                                </div>
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Best Budget Pick</span>
                                    </div>
                                    <h3 class="text-sm font-bold text-white mb-1">
                                        {reportData.best_value?.name}
                                    </h3>
                                    <p class="text-xs text-zinc-500 leading-relaxed">
                                        {reportData.best_value?.summary}
                                        {#if reportData.best_value?.price_tag}
                                            <span class="text-zinc-400 font-mono ml-1 bg-zinc-800 px-1 rounded">({reportData.best_value.price_tag})</span>
                                        {/if}
                                    </p>
                                </div>
                            </div>

                            <div class="p-5 flex items-start gap-4 hover:bg-zinc-900/50 transition-colors">
                                <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-lg">
                                    💡
                                </div>
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Expert Insight</span>
                                    </div>
                                    <h3 class="text-sm font-bold text-white mb-1">
                                        "{reportData.pro_tip?.title}"
                                    </h3>
                                    <p class="text-xs text-zinc-500 leading-relaxed italic opacity-80">
                                        {reportData.pro_tip?.content}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                    {:else if result.marketReport}
                    <div class="p-5 border border-zinc-800 bg-zinc-900/30 rounded-xl text-xs text-subtle">
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
