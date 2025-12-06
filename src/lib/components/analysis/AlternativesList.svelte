<script lang="ts">
    import type { AppItem } from '$lib/types';

    export let apps: AppItem[] = [];

    // Helper lấy Favicon
    const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    // LOGIC: Tách Sponsor và trộn vào đầu danh sách
    $: sponsors = apps.filter(a => a.isSponsor);
    $: organic = apps.filter(a => !a.isSponsor);
    
    // Display List: Sponsor đi trước, Organic đi sau
    $: displayList = [...sponsors, ...organic];
</script>

{#if displayList.length > 0}
    <div class="bento-card border border-zinc-800/60 bg-zinc-900/20 p-0 overflow-hidden">
        
        <div class="px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/50 flex justify-between items-center">
            <h3 class="text-[11px] font-mono text-subtle uppercase tracking-widest">
                Top Alternatives
            </h3>
        </div>

        <div class="divide-y divide-zinc-800">
            {#each displayList as app}
                <a 
                    href={app.affiliateUrl || app.url} 
                    target="_blank" 
                    rel="noopener noreferrer nofollow" 
                    class="group flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/50 transition-all duration-200"
                >
                    <div class="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        <img 
                            src={getFavicon(app.domain)} 
                            alt={app.name} 
                            class="w-4 h-4 transition-all {app.isSponsor ? 'opacity-100' : 'opacity-70 grayscale group-hover:grayscale-0'}" 
                        />
                    </div>
                    
                    <div class="min-w-0 flex-1">
                        <div class="flex justify-between items-center">
                            <div class="flex flex-col">
                                <span class="text-xs font-medium text-zinc-300 group-hover:text-white truncate">
                                    {app.name}
                                </span>
                                <span class="text-[10px] text-zinc-600 font-mono opacity-80">
                                    {app.domain}
                                </span>
                            </div>
                            
                            {#if app.isSponsor}
                                <div class="text-[10px] text-amber-500/80" title="Popular Choice">
                                    ★
                                </div>
                            {/if}
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    </div>
{/if}
