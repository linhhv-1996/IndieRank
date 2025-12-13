<script lang="ts">
    import { page } from "$app/stores";
    import { searchStore } from "$lib/stores";
    import { goto } from "$app/navigation";
    import { slugify } from "$lib/utils";
    import { navigating } from "$app/stores";

    $: isLandingPage = $page.url.pathname === "/";
    $: searchInput = $searchStore.keyword;
    $: isNavigating = !!$navigating;
    let isScanning = false;

    function unslugify(text: string) {
        return text?.replace(/-/g, " ") || "";
    }

    function handleSearch() {
        if (!searchInput.trim()) return;
        isScanning = true;
        searchStore.update((s) => ({ keyword: searchInput, country: 'us' }));
        const slug = slugify(searchInput);
        goto(`/analyze/us/${slug}`);
        isScanning = false;
    }

    $: if ($page.params.keyword) {
        searchInput = unslugify($page.params.keyword);
        searchStore.update((s) => ({ ...s, keyword: searchInput }));
    }
</script>

<header class="border-b border-border sticky top-0 bg-bg/90 backdrop-blur-md z-50 transition-all duration-300">
    <div class="max-w-custom mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative">
        
        <a href="/" class="flex items-center gap-2.5 hover:opacity-80 transition-opacity z-20 relative group shrink-0">
            <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold font-mono text-lg shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all">
                T
            </div>
            <div class="flex flex-col hidden sm:flex">
                <span class="text-base font-bold text-white leading-none tracking-tight">ToolSense</span>
                <span class="text-[9px] font-mono text-emerald-400 uppercase tracking-widest mt-0.5">
                    Directory
                </span>
            </div>
        </a>

        {#if !isLandingPage}
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md lg:max-w-xl px-4 hidden md:block z-10">
                <div class="relative flex items-center bg-zinc-900 rounded-lg border border-zinc-800 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-all p-1 gap-1.5 shadow-sm group-focus-within:bg-black">
                    <div class="pl-2 text-zinc-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input
                        type="text"
                        bind:value={searchInput}
                        on:keydown={(e) => e.key === "Enter" && handleSearch()}
                        class="w-full bg-transparent border-none focus:ring-0 text-white text-sm px-1 font-sans outline-none placeholder-zinc-600 h-9"
                        placeholder="Search software..."
                    />
                    <button
                        on:click={handleSearch}
                        disabled={isNavigating}
                        class="text-[11px] font-bold px-3 h-8 rounded-md bg-white text-black hover:bg-zinc-200 whitespace-nowrap transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {#if isScanning}
                            <span class="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                        {:else}
                            <span>Search</span>
                        {/if}
                    </button>
                </div>
            </div>
        {/if}

        <div class="flex items-center z-20 shrink-0">
            <a 
                href="mailto:contact@toolsense.com?subject=Feature Inquiry" 
                class="group flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[11px] font-bold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-emerald-900/20 border border-emerald-400/20 hover:scale-105 active:scale-95"
            >
                <span>Feature Your Product</span>
                <svg class="w-3 h-3 text-emerald-100 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
            </a>
        </div>

    </div>
</header>
