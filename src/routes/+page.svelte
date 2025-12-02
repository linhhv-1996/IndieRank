<script lang="ts">
    import { goto } from '$app/navigation';
    import { COUNTRIES } from '$lib/country_config';
    import { searchStore } from '$lib/stores';
    import { slugify } from '$lib/utils';

    let keyword = $searchStore.keyword;
    let country = 'us';
    let isScanning = false;

    function handleScan() {
        if (!keyword) return;
        isScanning = true;
        
        // Delay giả lập 1 chút cho đẹp visual
        setTimeout(() => {
            const slug = slugify(keyword);
            isScanning = false;
            goto(`/analyze/${country}/${slug}`);
        }, 500);
    }
    
    function presetSearch(val: string) {
        keyword = val;
        handleScan();
    }
</script>

<div class="relative flex-grow flex flex-col items-center justify-center px-6 py-10 min-h-[calc(100vh-4rem)]">
    <div class="hero-orbit"></div>

    <div class="w-full max-w-custom mx-auto text-center relative z-10">
        <!-- Top meta -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/70 text-[11px] font-mono text-subtle mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            <span>Indie Market Intel • Beta</span>
        </div>

        <!-- BIG CENTER LOGO -->
        <div class="mb-8 flex flex-col items-center gap-3">
            <div class="w-16 h-16 md:w-20 md:h-20 bg-accent rounded-2xl flex items-center justify-center text-black font-bold font-mono text-2xl shadow-soft">
                N
            </div>
            <div class="flex flex-col items-center">
                <span class="text-2xl font-semibold tracking-tight text-white">NicheRadar</span>
                <span class="text-[11px] font-mono text-subtle uppercase tracking-[0.18em] mt-1">
                    Market Reconnaissance
                </span>
            </div>
        </div>

        <!-- Headline -->
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-4 leading-tight">
            Market Intelligence
            <span class="block text-gray-500">for Indie Builders.</span>
        </h1>

        <p class="text-base md:text-lg text-subtle max-w-xl mx-auto mb-9">
            Stop obsessing over KD. Scan SERPs to spot weak competitors and hijack forum discussions where buyers already hang out.
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
                We only look at live Google results. No KD. No fake scores.
            </p>
        </div>

        <!-- Recent Keywords -->
        <div class="mt-10">
            <p class="text-[11px] font-mono text-subtle uppercase tracking-[0.18em] mb-3">Trending Searches</p>
            <div class="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto">
                {#each ['invoice generator for freelancers', 'habit tracker notion template', 'saas boilerplate nextjs'] as term}
                    <button 
                        class="px-3.5 py-1.5 bg-card border border-border rounded-full text-[12px] text-subtle hover:text-white hover:border-accent/60 hover:bg-card/80 cursor-pointer"
                        on:click={() => presetSearch(term)}
                    >
                        {term}
                    </button>
                {/each}
            </div>
        </div>
    </div>
</div>
