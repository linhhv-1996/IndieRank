<script lang="ts">
    import { goto } from '$app/navigation';
    import { COUNTRIES } from '$lib/country_config';
    import { searchStore } from '$lib/stores';
    import { slugify } from '$lib/utils';
    import type { PageData } from './$types';

    let keyword = $searchStore.keyword;
    let country = 'us';
    let isScanning = false;

    export let data: PageData;

    function handleScan() {
        if (!keyword) return;
        isScanning = true;
        setTimeout(() => {
            const slug = slugify(keyword);
            isScanning = false;
            goto(`/analyze/${country}/${slug}`);
        }, 500);
    }
</script>

<div class="relative flex-grow flex flex-col items-center justify-center px-6 py-10 min-h-[calc(100vh-4rem)]">
    <div class="hero-orbit"></div>

    <div class="w-full max-w-custom mx-auto text-center relative z-10">
        <!-- Headline -->
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-4 leading-tight">
            Discover Hidden Gems
            <span class="block text-gray-500">in Every Niche.</span>
        </h1>

        <p class="text-base md:text-lg text-subtle max-w-xl mx-auto mb-9">
            Stop digging through SEO spam.
            We analyze live search data to surface the best apps, templates, and authentic community discussions.
        </p>

        <!-- Search Input with Country -->
        <div class="w-full max-w-xl mx-auto">
            <div class="relative flex items-center bg-card rounded-xl border border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 transition-all p-1.5 shadow-soft">
                <!-- Country Select -->
                <div class="relative border-r border-border pr-2 mr-2 shrink-0 overflow-hidden">
            <select bind:value={country} class="w-full appearance-none bg-transparent text-white text-xs md:text-sm font-mono pl-3 pr-5 py-2 outline-none cursor-pointer hover:text-accent transition-colors truncate">
                {#each COUNTRIES as country}
                    <option value={country.gl}>{country.flag} {country.gl.toUpperCase()}</option>
                {/each}
            </select>
            
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-subtle">
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
        </div>

                <input 
                    type="text" 
                    bind:value={keyword}
                    on:keydown={(e) => e.key === 'Enter' && handleScan()}
                    class="w-full bg-transparent border-none focus:ring-0 text-white text-sm md:text-base px-2 py-2 font-mono placeholder-neutral-600 outline-none"
                    placeholder="e.g. time tracking app for personal use" 
                >

                <button 
                    on:click={handleScan}
                    disabled={isScanning}
                    class="bg-accent hover:bg-emerald-400 text-black text-xs md:text-sm font-medium py-2 px-4 rounded-lg whitespace-nowrap flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {#if isScanning}
                        <span>Scanning...</span>
                    {:else}
                        <span>Scan SERP</span>
                    {/if}
                </button>
            </div>
            <p class="mt-3 text-[11px] text-subtle font-mono uppercase tracking-[0.18em]">
                We only look at live Google results.
            </p>
        </div>

        <!-- Recent Keywords -->

        <div class="w-full max-w-4xl mx-auto mt-16">
            <div class="flex items-center justify-center gap-4 mb-6 opacity-100">
                <div class="h-px bg-zinc-800 w-12 md:w-20"></div>
                <p class="text-[11px] font-mono text-subtle uppercase tracking-[0.2em]">Trending Searches</p>
                <div class="h-px bg-zinc-800 w-12 md:w-20"></div>
            </div>
            
            {#if data.trendingSearches.length > 0}
                <div class="flex flex-wrap justify-center gap-2">
                    {#each data.trendingSearches as item}
                        <a href="/analyze/{item.country}/{item.slug}" class="px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-xs text-gray-400 hover:text-white">
                            {item.keyword}
                        </a>
                    {/each}
                </div>

                <div class="text-center mt-4">
                    <a href="/niches" class="inline-flex items-center gap-2 text-[11px] text-subtle hover:text-white transition-colors border-b border-transparent hover:border-zinc-700 pb-0.5">
                        View All Niches <span class="text-[10px]">→</span>
                    </a>
                </div>

            {:else}
                <div class="text-xs text-subtle italic">No recent searches.</div>
            {/if}
        </div>

    </div>
</div>
