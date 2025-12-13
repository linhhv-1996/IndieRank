<script lang="ts">
    import { goto } from '$app/navigation';
    import { searchStore } from '$lib/stores';
    import { slugify } from '$lib/utils';
    import type { PageData } from './$types';

    let keyword = $searchStore.keyword;
    // Bỏ biến country, mặc định là US
    let isScanning = false;

    export let data: PageData;

    function handleScan() {
        if (!keyword.trim()) return;
        isScanning = true;
        
        // Giả lập loading tí cho nguy hiểm, rồi bay thẳng vào US
        setTimeout(() => {
            const slug = slugify(keyword);
            isScanning = false;
            goto(`/analyze/us/${slug}`); 
        }, 600);
    }
</script>

<div class="relative flex-grow flex flex-col items-center justify-center px-6 py-10 min-h-[calc(100vh-4rem)] overflow-hidden">
    <div class="hero-orbit"></div>
    
    <div class="w-full max-w-4xl mx-auto text-center relative z-10">
        
        
        <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Find the Best Tools.<br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">Skip the SEO Spam.</span>
        </h1>

        <p class="text-base md:text-lg text-subtle max-w-2xl mx-auto mb-10 leading-relaxed">
            We analyze thousands of search results to build instant <strong>comparison tables</strong> and <strong>unbiased rankings</strong> for any software category.
        </p>

        <div class="w-full max-w-2xl mx-auto relative group mb-16">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
            
            <div class="relative flex items-center bg-[#0F0F10] rounded-xl border border-zinc-800 focus-within:border-zinc-600 shadow-2xl p-2 transition-colors">
                
                <div class="pl-4 pr-3 text-zinc-500">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>

                <input 
                    type="text" 
                    bind:value={keyword}
                    on:keydown={(e) => e.key === 'Enter' && handleScan()}
                    class="w-full bg-transparent border-none focus:ring-0 text-white text-base md:text-lg placeholder-zinc-600 outline-none h-12"
                    placeholder="e.g. free email marketing for startups..." 
                    autofocus
                >

                <button 
                    on:click={handleScan}
                    disabled={isScanning}
                    class="ml-2 bg-white hover:bg-zinc-200 text-black text-sm font-bold py-3 px-6 rounded-lg whitespace-nowrap flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-white/5"
                >
                    {#if isScanning}
                        <span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                    {:else}
                        <span>Search</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    {/if}
                </button>
            </div>
        </div>

        <div class="border-zinc-800/50 pt-8">
            <p class="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-6">
                Trending Explorations
            </p>
            
            {#if data.trendingSearches.length > 0}
                <div class="flex flex-wrap justify-center gap-3">
                    {#each data.trendingSearches.slice(0, 6) as item}
                        <a href="/analyze/us/{item.slug}" class="group flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-700 transition-all">
                            <span class="text-xs text-zinc-400 group-hover:text-white font-medium">{item.keyword}</span>
                        </a>
                    {/each}
                </div>

                 <div class="text-center mt-4">
                    <a href="/niches" class="inline-flex items-center gap-2 text-[11px] text-subtle hover:text-white transition-colors border-b border-transparent hover:border-zinc-700 pb-0.5">
                        View All Niches <span class="text-[10px]">→</span>
                    </a>
                </div>
            {:else}
                 <div class="flex flex-wrap justify-center gap-3 opacity-40">
                    <span class="px-4 py-2 rounded-full border border-zinc-800 text-xs text-zinc-500">AI Video Generator</span>
                    <span class="px-4 py-2 rounded-full border border-zinc-800 text-xs text-zinc-500">Best Crypto Tax Tool</span>
                    <span class="px-4 py-2 rounded-full border border-zinc-800 text-xs text-zinc-500">Notion Alternatives</span>
                </div>
            {/if}
        </div>

    </div>
</div>

