<script lang="ts">
    import { page } from "$app/stores";
    import { searchStore } from "$lib/stores";
    import { goto, invalidateAll } from "$app/navigation";
    import { auth } from "$lib/firebase.client";
    import { slide } from "svelte/transition";
    import { slugify } from "$lib/utils";
    import { navigating } from "$app/stores";
    import { COUNTRIES } from "$lib/country_config";

    $: isLandingPage = $page.url.pathname === "/";
    $: searchInput = $searchStore.keyword;
    $: user = $page.data.user;

    let isMenuOpen = false;

    $: isNavigating = !!$navigating;

    let country = $searchStore.country;
    let isScanning = false;

    // --- Action: Click Outside ---
    function clickOutside(node: HTMLElement) {
        const handleClick = (event: MouseEvent) => {
            if (
                node &&
                !node.contains(event.target as Node) &&
                !event.defaultPrevented
            ) {
                node.dispatchEvent(new CustomEvent("click_outside"));
            }
        };
        document.addEventListener("click", handleClick, true);
        return {
            destroy() {
                document.removeEventListener("click", handleClick, true);
            },
        };
    }

    function handleSearch() {
        if (!searchInput.trim()) return;
        isScanning = true;
        searchStore.update((s) => ({ keyword: searchInput, country: country }));

        const slug = slugify(searchInput);
        goto(`/analyze/${country}/${slug}`);
        isScanning = false;
    }

    async function handleLogout() {
        isMenuOpen = false;
        try {
            await fetch("/api/session", { method: "DELETE" });
            await auth.signOut();
            await invalidateAll();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }
</script>

<header
    class="border-b border-border sticky top-0 bg-bg/90 backdrop-blur-md z-50"
>
    <div
        class="max-w-custom mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4"
    >
        <a
            href="/"
            class="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
            <div
                class="w-7 h-7 bg-accent rounded-md flex items-center justify-center text-black font-bold font-mono text-xs shadow-glow"
            >
                N
            </div>
            <div class="flex flex-col">
                <span class="text-sm font-semibold text-white leading-tight"
                    >NicheRadar</span
                >
                <span
                    class="text-[11px] font-mono text-subtle uppercase tracking-[0.16em]"
                    >Market Recon</span
                >
            </div>
        </a>

        {#if !isLandingPage}
            <div class="flex-1 max-w-lg mx-0 md:mx-6 hidden md:block">
                <div
                    class="relative flex items-center bg-card rounded-lg border border-border focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/25 transition-all p-1.5 gap-1.5"
                >
                    <div class="relative border-r border-border pr-1.5 mr-1">
                        <select
                            bind:value={country}
                            class="appearance-none bg-transparent text-white text-[11px] font-mono pl-2.5 pr-4 py-1.5 outline-none cursor-pointer"
                        >
                            {#each COUNTRIES as country}
                                <option value={country.gl}
                                    >{country.flag}
                                    {country.gl.toUpperCase()}</option
                                >
                            {/each}
                        </select>
                        <div
                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-subtle"
                        >
                            <svg
                                class="h-2.5 w-2.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 9l-7 7-7-7"
                                ></path></svg
                            >
                        </div>
                    </div>
                    <input
                        type="text"
                        bind:value={searchInput}
                        on:keydown={(e) => e.key === "Enter" && handleSearch()}
                        class="w-full bg-transparent border-none focus:ring-0 text-white text-xs md:text-sm px-1.5 font-mono outline-none placeholder-zinc-600"
                    />

                    <button
                        on:click={handleSearch}
                        disabled={isNavigating}
                        class="text-[11px] md:text-xs font-mono px-3 py-1.5 rounded-md bg-accent/10 border border-accent/40 text-accent hover:bg-accent hover:text-black hover:border-accent whitespace-nowrap transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {#if isScanning}
                            <span
                                class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
                            ></span>
                            <span>Scanning...</span>
                        {:else}
                            <span>Scan SERP</span>
                        {/if}
                    </button>
                </div>
            </div>
        {/if}

        <div class="flex items-center gap-3">
            {#if user}
                <div
                    class="relative"
                    use:clickOutside
                    on:click_outside={() => (isMenuOpen = false)}
                >
                    <button
                        on:click={() => (isMenuOpen = !isMenuOpen)}
                        class="flex items-center gap-3 py-1 px-2 rounded-full hover:bg-zinc-800/50 transition-all border border-transparent hover:border-zinc-700/50 group"
                    >
                        <div
                            class="hidden sm:flex flex-col items-end text-right"
                        >
                            <span
                                class="text-xs font-medium text-white leading-tight group-hover:text-accent transition-colors"
                                >{user.email?.split("@")[0]}</span
                            >
                            <span class="text-[10px] text-subtle font-mono"
                                >Free Plan</span
                            >
                        </div>
                        <div
                            class="w-8 h-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center overflow-hidden shadow-sm group-hover:border-accent/50 transition-colors"
                        >
                            {#if user.picture}
                                <img
                                    src={user.picture}
                                    alt="Avatar"
                                    class="w-full h-full object-cover"
                                />
                            {:else}
                                <span class="text-xs font-mono text-subtle"
                                    >{user.email?.charAt(0).toUpperCase()}</span
                                >
                            {/if}
                        </div>
                        <svg
                            class="w-3 h-3 text-subtle transition-transform duration-200 {isMenuOpen
                                ? 'rotate-180'
                                : ''}"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            ></path></svg
                        >
                    </button>

                    {#if isMenuOpen}
                        <div
                            transition:slide={{ duration: 150, axis: "y" }}
                            class="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/5"
                        >
                            <div
                                class="px-4 py-3 border-b border-border bg-zinc-800/30"
                            >
                                <p
                                    class="text-[10px] text-subtle font-mono uppercase tracking-wider mb-1"
                                >
                                    Signed in as
                                </p>
                                <p
                                    class="text-sm font-medium text-white truncate"
                                >
                                    {user.email}
                                </p>
                            </div>
                            <div class="py-1">
                                <button
                                    class="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2.5"
                                >
                                    <svg
                                        class="w-4 h-4 text-subtle"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        ></path></svg
                                    > Profile
                                </button>
                            </div>
                            <div class="border-t border-border my-1"></div>
                            <div class="py-1">
                                <button
                                    on:click={handleLogout}
                                    class="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
                                >
                                    <svg
                                        class="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        ></path></svg
                                    > Log out
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            {:else}
                <a
                    href="/login"
                    class="text-xs font-medium bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors shadow-sm"
                    >Login</a
                >
            {/if}
        </div>
    </div>
</header>
