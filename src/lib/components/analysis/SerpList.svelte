<script lang="ts">
    export let items: Array<{
        rank: string;
        domain: string;
        title: string;
        url: string;
        snippet: string;
        tags: string[];
        isWeakSpot: boolean;
    }> = [];
</script>

<section class="bento-card p-0 overflow-hidden">
    <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-card/90">
        <h3 class="text-sm font-medium text-white">SERP Landscape (Top 10)</h3>
        <span class="text-[10px] text-subtle font-mono">Source: Google (US)</span>
    </div>
    <div class="divide-y divide-border">
        {#each items as item}
            <div class="px-6 py-3.5 group serp-row transition-colors hover:bg-zinc-900/50 {item.isWeakSpot ? 'bg-accent/5 relative' : ''}">
                {#if item.isWeakSpot}
                    <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-accent"></div>
                {/if}
                
                <div class="flex items-start gap-4">
                    <span class="font-mono text-xs w-6 pt-1 {item.isWeakSpot ? 'text-accent font-bold' : 'text-subtle'}">
                        {item.rank}
                    </span>

                    <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1">
                            <span class="text-[10px] font-mono truncate max-w-[150px] {item.isWeakSpot ? 'text-accent' : 'text-subtle'}">
                                {item.domain}
                            </span>
                            {#each item.tags as tag}
                                <span class="text-[9px] px-1.5 py-0.5 rounded-full border 
                                    {item.isWeakSpot 
                                        ? 'border-accent/30 text-accent bg-accent/10' 
                                        : 'border-zinc-700 text-subtle'}">
                                    {tag}
                                </span>
                            {/each}
                        </div>

                        <a href={item.url} target="_blank" rel="noopener noreferrer" class="text-sm md:text-base block mb-1 truncate transition-colors hover:text-accent hover:underline {item.isWeakSpot ? 'text-white font-medium' : 'text-gray-300'}">
                            {item.title}
                        </a>

                        {#if item.snippet}
                            <p class="text-xs text-subtle line-clamp-1 opacity-80">{item.snippet}</p>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
</section>
