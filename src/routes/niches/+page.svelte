<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;
    
    // Sắp xếp ABC
    $: items = data.niches.sort((a, b) => a.keyword.localeCompare(b.keyword));
</script>

<svelte:head>
    <title>Market Directory</title>
</svelte:head>

<div class="min-h-screen py-16 px-4 md:px-6 max-w-6xl mx-auto flex flex-col items-center">
    
    <div class="mb-12 text-center max-w-2xl">
        
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            Market Directory
        </h1>
        <p class="text-sm text-subtle font-mono">
            Scanning {items.length} active niches.
        </p>
    </div>

    {#if items.length > 0}
        <div class="flex flex-wrap justify-center gap-2.5">
            {#each items as item}
                <a 
                    href="/analyze/{item.country}/{item.slug}"
                    class="group flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-200 cursor-pointer"
                >
                    <span class="text-xs md:text-sm text-zinc-400 group-hover:text-white font-medium">
                        {item.keyword.toLowerCase()}
                    </span>
                    
                    <span class="text-[9px] font-mono text-zinc-600 bg-black/20 px-1 py-0.5 rounded group-hover:text-zinc-400 uppercase">
                        {item.country}
                    </span>
                </a>
            {/each}
        </div>
    {:else}
        <div class="py-20 flex flex-col items-center gap-4 opacity-50">
            <div class="w-10 h-10 border-2 border-zinc-800 border-t-zinc-500 rounded-full animate-spin"></div>
            <p class="text-xs text-subtle font-mono">Loading Index...</p>
        </div>
    {/if}
</div>
