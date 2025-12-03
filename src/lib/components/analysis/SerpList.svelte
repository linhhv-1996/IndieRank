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

    // Nhận thêm prop sponsor
    export let sponsor: any = null;

    // Helper lấy favicon
    const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
</script>

<section class="bento-card p-0 overflow-hidden">
    <div class="px-6 py-5 border-b border-border bg-card/90 backdrop-blur flex justify-between items-center sticky top-0 z-10">
        <div>
            <h3 class="text-base font-semibold text-white">Top 10 Market Leaders</h3>
            <p class="text-xs text-subtle mt-0.5">Most relevant results ranking on Google</p>
        </div>
        <span class="text-[10px] uppercase tracking-wider font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
            Organic Rank
        </span>
    </div>

    {#if sponsor}
        <div class="bg-gradient-to-r from-emerald-900/10 to-transparent border-b border-emerald-500/20 p-5 relative group">
            <div class="absolute top-3 right-3 flex items-center gap-2">
                <span class="text-[9px] font-bold text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider bg-black/20">
                    Sponsored
                </span>
            </div>

            <div class="flex gap-4 items-start">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg shrink-0">
                    ★
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white mb-1 truncate">
                        <a href={sponsor.url} target="_blank" rel="sponsored" class="hover:underline">{sponsor.title}</a>
                    </h4>
                    <p class="text-xs text-emerald-200/70 mb-3 line-clamp-2">{sponsor.snippet}</p>
                    
                    <a href={sponsor.url} target="_blank" rel="sponsored" class="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded transition-colors">
                        Visit Website <span class="text-[10px]">→</span>
                    </a>
                </div>
            </div>
        </div>
    {/if}

    <div class="divide-y divide-border bg-bg/30">
        {#each items as item}
            <div class="px-6 py-4 group hover:bg-zinc-900/40 transition-colors relative">
                {#if item.isWeakSpot}
                    <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-yellow-500/50"></div>
                {/if}
                
                <div class="flex items-start gap-4">
                    <span class="font-mono text-xs w-6 pt-1 text-subtle/50 font-bold">
                        #{item.rank}
                    </span>

                    <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1.5">
                            <img src={getFavicon(item.domain)} alt="" class="w-3.5 h-3.5 rounded-sm opacity-60 grayscale group-hover:grayscale-0 transition-all" />
                            <span class="text-[10px] font-mono text-subtle truncate max-w-[150px]">
                                {item.domain}
                            </span>
                            
                            {#each item.tags as tag}
                                <span class="text-[9px] px-1.5 py-0.5 rounded border border-border text-subtle bg-zinc-800/50">
                                    {tag}
                                </span>
                            {/each}
                        </div>

                        <a href={item.url} target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-gray-300 block mb-1 truncate transition-colors group-hover:text-accent group-hover:underline decoration-accent/50 underline-offset-2">
                            {item.title}
                        </a>

                        {#if item.snippet}
                            <p class="text-xs text-subtle line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                {item.snippet}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
    
    <div class="px-6 py-3 bg-zinc-900/30 border-t border-border text-[10px] text-center text-subtle font-mono">
        Data updated via Google SERP API
    </div>
</section>
