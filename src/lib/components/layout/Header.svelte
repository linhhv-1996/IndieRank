<script lang="ts">
    import { page } from '$app/stores';
    import { userStore, login, logout, searchStore } from '$lib/stores';
    import { goto } from '$app/navigation';

    // Logic: Kiểm tra xem có phải trang chủ không để ẩn/hiện search
    $: isLandingPage = $page.url.pathname === '/';

    let searchInput = $searchStore.keyword;

    function handleSearch() {
        if (!searchInput.trim()) return;
        searchStore.update(s => ({ ...s, keyword: searchInput }));
        // Reload page logic or call API here
        console.log("Searching for:", searchInput);
    }
</script>

<header class="border-b border-border sticky top-0 bg-bg/90 backdrop-blur-md z-50">
    <div class="max-w-custom mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <!-- LEFT: Logo + name -->
        <a href="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div class="w-7 h-7 bg-accent rounded-md flex items-center justify-center text-black font-bold font-mono text-xs">
                N
            </div>
            <div class="flex flex-col">
                <span class="text-sm font-semibold text-white leading-tight">NicheRadar</span>
                <span class="text-[11px] font-mono text-subtle uppercase tracking-[0.16em]">Market Recon</span>
            </div>
        </a>

        <!-- CENTER: Search with button (CHỈ HIỆN KHI KHÔNG PHẢI LANDING PAGE) -->
        {#if !isLandingPage}
            <div class="flex-1 max-w-lg mx-0 md:mx-6 hidden md:block">
                <div class="relative flex items-center bg-card rounded-lg border border-border focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/25 transition-all p-1.5 gap-1.5">
                    <!-- Country Select Mini -->
                    <div class="relative border-r border-border pr-1.5 mr-1">
                        <select class="appearance-none bg-transparent text-white text-[11px] font-mono pl-2.5 pr-5 py-1.5 outline-none cursor-pointer">
                            <option value="us">🇺🇸 US</option>
                            <option value="uk">🇬🇧 UK</option>
                            <option value="vn">🇻🇳 VN</option>
                            <option value="sg">🇸🇬 SG</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-subtle">
                            <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                    <input 
                        type="text" 
                        bind:value={searchInput}
                        on:keydown={(e) => e.key === 'Enter' && handleSearch()}
                        class="w-full bg-transparent border-none focus:ring-0 text-white text-xs md:text-sm px-1.5 font-mono outline-none"
                    >
                    <button on:click={handleSearch} class="text-[11px] md:text-xs font-mono px-3 py-1.5 rounded-md bg-accent/10 border border-accent/40 text-accent hover:bg-accent hover:text-black hover:border-accent whitespace-nowrap">
                        Scan SERP
                    </button>
                </div>
            </div>
        {/if}

        <!-- RIGHT: Auth State -->
        <div class="flex items-center gap-3">
            {#if $userStore}
                <!-- Logged In State -->
                <span class="text-[11px] font-mono text-subtle hidden sm:inline">Credits: {$userStore.credits}</span>
                <button on:click={logout} class="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-border/80 flex items-center justify-center text-[11px] text-subtle font-mono hover:border-accent transition-colors">
                    {$userStore.username}
                </button>
            {:else}
                <!-- Logged Out State -->
                <button 
                    on:click={login}
                    class="text-xs font-medium bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Login
                </button>
            {/if}
        </div>
    </div>
</header>
