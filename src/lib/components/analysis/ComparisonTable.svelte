<script lang="ts">
    import type { AppItem } from '$lib/types';
    export let apps: AppItem[] = [];

    $: topApps = apps.slice(0, 5);

    const getPricingColor = (p: string) => {
        if (p === 'Free') return 'text-emerald-400';
        if (p === 'Freemium') return 'text-blue-400';
        return 'text-zinc-400';
    };

    const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    const handleRowClick = (url: string) => {
        if (url) window.open(url, '_blank');
    };
</script>

<div class="bento-card overflow-hidden bg-zinc-900/20 border-zinc-800/60">
    <div class="overflow-x-auto">
        <table class="w-full text-left text-xs table-fixed min-w-[600px]">
            <thead>
                <tr class="border-b border-zinc-800/60 bg-zinc-900/30 text-subtle font-mono">
                    <th class="px-4 py-3 font-medium w-[30%]">Tool</th>
                    <th class="px-4 py-3 font-medium w-[15%]">Pricing</th>
                    <th class="px-4 py-3 font-medium w-[20%]">Rating</th>
                    <th class="px-4 py-3 font-medium w-[35%]">Key Features</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
                {#each topApps as app}
                    <tr 
                        class="group hover:bg-zinc-800/30 transition-colors cursor-pointer"
                        on:click={() => handleRowClick(app.url)}
                    >
                        <td class="px-4 py-3 font-medium text-zinc-200">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/50">
                                    <img 
                                        src={getFavicon(app.domain)} 
                                        alt={app.name} 
                                        class="w-4 h-4 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                                <span class="truncate group-hover:text-accent group-hover:underline decoration-accent/50 underline-offset-2 transition-colors block">
                                    {app.name}
                                </span>
                            </div>
                        </td>
                        
                        <td class="px-4 py-3 font-mono {getPricingColor(app.pricingModel || '')} truncate">
                            {app.pricingModel || '?'}
                        </td>
                        
                        <td class="px-4 py-3 text-amber-400 font-mono truncate">
                            {#if app.rating && app.rating > 0}
                                ★ {app.rating} <span class="text-zinc-600 text-[10px]">({app.reviewCount || 'N/A'})</span>
                            {:else}
                                <span class="text-zinc-700">-</span>
                            {/if}
                        </td>
                        
                        <td class="px-4 py-3 text-zinc-400">
                            {#if app.features.length > 0}
                                <div class="flex flex-wrap gap-1.5 overflow-hidden h-[22px]"> {#each app.features.slice(0, 2) as feat}
                                        <span class="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] whitespace-nowrap group-hover:border-zinc-600 transition-colors truncate max-w-full">
                                            {feat}
                                        </span>
                                    {/each}
                                </div>
                            {:else}
                                <span class="text-zinc-700 text-[10px] italic">No data</span>
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
