<script lang="ts">
    import type { AppItem } from '$lib/types';
    export let apps: AppItem[] = [];
    
    // Lấy top 5
    $: topApps = apps.slice(0, 5);

    const getPricingColor = (p: string) => {
        if (!p) return 'text-zinc-500';
        const lower = p.toLowerCase();
        if (lower.includes('free') && !lower.includes('trial')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (lower.includes('freemium')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    };

    const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    
    const handleRowClick = (url: string) => {
        if (url) window.open(url, '_blank');
    };
</script>

<div class="bento-card overflow-hidden bg-zinc-900/40 border-zinc-800/60 backdrop-blur-sm">
    <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left text-xs table-fixed min-w-[700px]">
            <thead>
                <tr class="border-b border-zinc-800/80 bg-zinc-900/50 text-subtle font-mono uppercase tracking-wider">
                    <th class="px-5 py-4 font-medium w-[25%]">Tool</th>
                    <th class="px-4 py-4 font-medium w-[15%]">Pricing</th>
                    <th class="px-4 py-4 font-medium w-[25%]">Best For</th>
                    <th class="px-4 py-4 font-medium w-[35%]">Top Features</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
                {#each topApps as app}
                    <tr 
                        class="group hover:bg-zinc-800/40 transition-colors cursor-pointer relative"
                        on:click={() => handleRowClick(app.url)}
                    >
                        <td class="px-5 py-4 align-top">
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800 group-hover:border-zinc-600 transition-colors shadow-sm mt-0.5">
                                    <img 
                                        src={getFavicon(app.domain)} 
                                        alt={app.name} 
                                        class="w-4 h-4 object-contain opacity-90"
                                        loading="lazy"
                                    />
                                </div>
                                <div class="flex flex-col min-w-0">
                                    <span class="font-bold text-sm text-zinc-200 group-hover:text-accent transition-colors truncate block">
                                        {app.name}
                                    </span>
                                    <span class="text-[10px] text-zinc-500 font-mono truncate">
                                        {app.domain}
                                    </span>
                                </div>
                            </div>
                        </td>
                        
                        <td class="px-4 py-4 align-top">
                            <span class="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-mono border font-medium {getPricingColor(app.pricingModel)}">
                                {app.pricingModel || 'Unknown'}
                            </span>
                        </td>
                        
                        <td class="px-4 py-4 align-top">
                            {#if app.audience}
                                <span class="text-zinc-300 text-[11px] leading-snug line-clamp-2 group-hover:text-white transition-colors">
                                    {app.audience}
                                </span>
                            {:else}
                                <span class="text-zinc-700 text-[10px]">-</span>
                            {/if}
                        </td>
                        
                        <td class="px-4 py-4 align-top">
                            {#if app.features.length > 0}
                                <div class="flex flex-wrap gap-1.5">
                                    {#each app.features.slice(0, 3) as feat}
                                        <span class="
                                            inline-flex items-center px-1.5 py-0.5 rounded 
                                            bg-zinc-800/60 border border-zinc-700/60 
                                            text-[10px] text-zinc-400 whitespace-nowrap 
                                            group-hover:border-zinc-600 group-hover:text-zinc-300 transition-colors
                                        ">
                                            {feat}
                                        </span>
                                    {/each}
                                    
                                    {#if app.features.length > 3}
                                        <span class="text-[9px] text-zinc-600 font-mono py-0.5 px-1">
                                            +{app.features.length - 3}
                                        </span>
                                    {/if}
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

<style>
    /* Custom scrollbar cho bảng nếu bị tràn ngang trên mobile */
    .custom-scrollbar::-webkit-scrollbar {
        height: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #3f3f46;
        border-radius: 4px;
    }
</style>
