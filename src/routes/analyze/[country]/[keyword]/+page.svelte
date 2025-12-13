<script lang="ts">
    import type { PageData } from './$types';
    import AppGrid from '$lib/components/analysis/AppGrid.svelte';
    import Sidebar from '$lib/components/analysis/Sidebar.svelte';
    import ComparisonTable from '$lib/components/analysis/ComparisonTable.svelte';
    import MarketVerdict from '$lib/components/analysis/MarketVerdict.svelte';
    
    export let data: PageData;
    // Destructuring data từ server
    $: ({ keyword, country, marketReport, apps, seedingTargets, alternatives, pivotIdeas } = data);
    
    let reportData: any = null;
    let verdict: any = null;

    // Parse Market Report & Map sang Verdict Component
    $: if (marketReport) {
        try {
            reportData = JSON.parse(marketReport);
            
            // MAP DỮ LIỆU TỪ AI REPORT SANG COMPONENT VERDICT
            // Nếu có editor_choice, tạo object verdict để component hiển thị
            if (reportData.editor_choice) {
                const ec = reportData.editor_choice;
                verdict = {
                    status: "Market Leader", // Hoặc "Editor's Choice"
                    title: ec.name,
                    color: 'green',
                    // Kết hợp Summary + Pros thành HTML để render
                    description: `
                        <p class="mb-3 font-medium text-zinc-200 leading-relaxed">${ec.summary}</p>
                        <div class="space-y-1">
                            <p class="text-[10px] uppercase tracking-wider text-emerald-500 font-bold mb-1">Why it wins:</p>
                            <ul class="list-disc list-inside text-zinc-400 text-xs space-y-1 pl-1">
                                ${ec.pros?.map((p: any) => `<li>${p}</li>`).join('') || ''}
                            </ul>
                        </div>
                        ${ec.con ? `<div class="mt-3 pt-3 border-t border-zinc-800/50"><p class="text-red-400/80 text-[10px]">⚠️ <strong>Limitation:</strong> ${ec.con}</p></div>` : ''}
                    `
                };
            }
        } catch (e) {
            console.error("Error parsing market report:", e);
        }
    }

    // Lọc top 5 cho bảng so sánh (Bỏ những thằng không rõ giá)
    $: compareList = apps.slice(0, 5);
</script>

<svelte:head>
    <title>Best {keyword} Tools & Alternatives ({new Date().getFullYear()})</title>
    <meta name="description" content={reportData?.editor_choice?.summary || `Compare the best ${keyword} tools based on real data.`} />
</svelte:head>

<div class="max-w-custom mx-auto px-4 md:px-6 py-8 w-full">
    <div class="mb-8">
        <a href="/" class="text-[11px] text-subtle hover:text-white mb-4 inline-flex items-center gap-1 group">
            <span class="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Home
        </a>
        <h1 class="text-3xl md:text-4xl font-bold text-white capitalize mb-3 tracking-tight">{keyword}</h1>
        
        
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div class="lg:col-span-8 space-y-8">
            
            {#if verdict}
                <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MarketVerdict 
                        verdict={verdict} 
                        url="https://elevenlabs.io/?your_aff_code" 
                        cta="Try ElevenLabs Free" 
                    />
                </div>
            {/if}

            {#if compareList.length > 1}
                <div class="space-y-3">
                    <div class="flex items-center justify-between px-1">
                        <h2 class="text-[11px] font-mono font-medium text-subtle uppercase tracking-widest">
                            Quick Comparison
                        </h2>
                        {#if reportData?.best_value}
                            <div class="hidden sm:flex items-center gap-2 text-[10px] bg-blue-500/5 border border-blue-500/20 px-2.5 py-1 rounded-full text-blue-400">
                                <span>💎 Best Value:</span>
                                <span class="font-bold text-blue-300">{reportData.best_value.name}</span>
                            </div>
                        {/if}
                    </div>
                    <ComparisonTable apps={compareList} />
                </div>
            {/if}

            {#if reportData?.pro_tip}
                <div class="bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-5 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>
                    
                    <div class="relative z-10 flex gap-4">
                        <div class="shrink-0 w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-amber-400 mb-1">
                                {reportData.pro_tip.title || "Expert Advice"}
                            </h3>
                            <p class="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                                {reportData.pro_tip.content}
                            </p>
                        </div>
                    </div>
                </div>
            {/if}

            <div class="pt-4">
                <AppGrid {apps} />
            </div>
        </div>

        <Sidebar 
            targets={seedingTargets} 
            {alternatives}
            relatedSearches={pivotIdeas}
            {country}
        />
    </div>
</div>
