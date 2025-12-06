<script lang="ts">
    import { page } from "$app/stores";
    import { searchStore } from "$lib/stores";
    import { goto } from "$app/navigation";
    import { slugify } from "$lib/utils";
    import { navigating } from "$app/stores";
    
    // Check trang chủ để ẩn thanh search
    $: isLandingPage = $page.url.pathname === "/";
    $: searchInput = $searchStore.keyword;
    
    // Trạng thái loading khi chuyển trang
    $: isNavigating = !!$navigating;
    let isScanning = false;

    function unslugify(text: string) {
        return text?.replace(/-/g, " ") || "";
    }

    function handleSearch() {
        if (!searchInput.trim()) return;
        isScanning = true;
        
        // Luôn set country là 'us'
        searchStore.update((s) => ({ keyword: searchInput, country: 'us' }));

        const slug = slugify(searchInput);
        goto(`/analyze/us/${slug}`);
        isScanning = false;
    }

    // Tự điền input nếu vào trực tiếp link
    $: if ($page.params.keyword) {
        searchInput = unslugify($page.params.keyword);
        searchStore.update((s) => ({ ...s, keyword: searchInput }));
    }
</script>

<header class="border-b border-border sticky top-0 bg-bg/90 backdrop-blur-md z-50">
    <div class="max-w-custom mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative">
        
        <a href="/" class="flex items-center gap-2.5 hover:opacity-80 transition-opacity z-10 relative">
            <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold font-mono text-lg shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                T
            </div>
            <div class="flex flex-col">
                <span class="text-base font-bold text-white leading-none tracking-tight">ToolSense</span>
                <span class="text-[9px] font-mono text-emerald-400 uppercase tracking-widest mt-0.5">
                    Directory
                </span>
            </div>
        </a>

        {#if !isLandingPage}
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-4 hidden md:block z-0">
                <div class="relative flex items-center bg-zinc-900 rounded-lg border border-zinc-800 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-all p-1 gap-1.5 shadow-sm">
                    
                    <div class="pl-2 text-zinc-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>

                    <input
                        type="text"
                        bind:value={searchInput}
                        on:keydown={(e) => e.key === "Enter" && handleSearch()}
                        class="w-full bg-transparent border-none focus:ring-0 text-white text-sm px-1 font-sans outline-none placeholder-zinc-600 h-9"
                        placeholder="Search software, tools, alternatives..."
                    />

                    <button
                        on:click={handleSearch}
                        disabled={isNavigating}
                        class="text-[11px] font-bold px-3 h-8 rounded-md bg-white text-black hover:bg-zinc-200 whitespace-nowrap transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {#if isScanning}
                            <span class="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                        {:else}
                            <span>Scan</span>
                        {/if}
                    </button>
                </div>
            </div>
        {/if}

        <div class="hidden md:block w-8"></div> 
        </div>
</header>
