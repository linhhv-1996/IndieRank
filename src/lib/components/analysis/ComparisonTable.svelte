<script lang="ts">
    import type { AppItem } from '$lib/types';
    export let apps: AppItem[] = [];

    // Chỉ lấy top 5 để so sánh cho gọn
    $: topApps = apps.slice(0, 5);

    const getPricingColor = (p: string) => {
        if (p === 'Free') return 'text-emerald-400';
        if (p === 'Freemium') return 'text-blue-400';
        return 'text-zinc-400';
    };
</script>

<div class="bento-card overflow-hidden bg-zinc-900/20 border-zinc-800/60">
    <div class="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <h3 class="text-[11px] font-mono text-subtle uppercase tracking-widest">
            Quick Comparison
        </h3>
    </div>
    
    <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
            <thead>
                <tr class="border-b border-zinc-800/60 bg-zinc-900/30 text-subtle font-mono">
                    <th class="px-4 py-3 font-medium min-w-[120px]">Tool</th>
                    <th class="px-4 py-3 font-medium">Pricing</th>
                    <th class="px-4 py-3 font-medium">Rating</th>
                    <th class="px-4 py-3 font-medium min-w-[150px]">Key Features</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
                {#each topApps as app}
                    <tr class="group hover:bg-zinc-800/30 transition-colors">
                        <td class="px-4 py-3 font-medium text-zinc-200">
                            <a href={app.url} target="_blank" rel="nofollow" class="hover:text-accent hover:underline decoration-accent/50 underline-offset-2">
                                {app.name}
                            </a>
                        </td>
                        <td class="px-4 py-3 font-mono {getPricingColor(app.pricingModel || '')}">
                            {app.pricingModel || '?'}
                        </td>
                        <td class="px-4 py-3 text-amber-400 font-mono">
                            {#if app.rating}
                                ★ {app.rating} <span class="text-zinc-600 text-[10px]">({app.reviewCount || 'N/A'})</span>
                            {:else}
                                <span class="text-zinc-700">-</span>
                            {/if}
                        </td>
                        <td class="px-4 py-3 text-zinc-400">
                            {#if app.features.length > 0}
                                <div class="flex flex-wrap gap-1">
                                    {#each app.features.slice(0, 2) as feat}
                                        <span class="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] whitespace-nowrap">
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
