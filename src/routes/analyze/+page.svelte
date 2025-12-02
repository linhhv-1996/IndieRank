<script lang="ts">
    import { searchStore } from '$lib/stores';
    import MarketVerdict from '$lib/components/analysis/MarketVerdict.svelte';
    import SeedingTargets from '$lib/components/analysis/SeedingTargets.svelte';
    import SerpList from '$lib/components/analysis/SerpList.svelte';
    import Sidebar from '$lib/components/analysis/Sidebar.svelte';

    // Hàm giả lập nút Back để quay về trang Search
    function goBack() {
        history.back();
    }

    const keyword = $searchStore.keyword || "Time tracking app for personal use";
</script>

<div class="max-w-custom mx-auto px-4 md:px-6 py-8 w-full">
    <!-- Back above keyword -->
    <div class="mb-3">
        <button type="button" on:click={goBack} class="inline-flex items-center gap-2 text-[11px] font-mono text-subtle hover:text-white">
            <span class="flex items-center justify-center w-5 h-5 rounded-full border border-border">
                ←
            </span>
            <span>Back</span>
            <span class="hidden sm:inline">to search</span>
        </button>
    </div>

    <!-- Top Section: Title -->
    <div class="mb-8">
        <h2 class="text-2xl md:text-3xl font-semibold text-white mb-2">
            {keyword}
        </h2>
        <div class="flex flex-wrap items-center gap-3 text-[11px] text-subtle font-mono">
            <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 bg-accent rounded-full"></span> Live Analysis
            </span>
            <span>•</span>
            <span>Region: United States (EN)</span>
            <span>•</span>
            <span>Intent: Transactional</span>
        </div>
    </div>

    <!-- Bento Grid Layout: Left 8 / Right 4 -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- COL LEFT -->
        <div class="lg:col-span-8 space-y-8">
            <MarketVerdict />
            <SeedingTargets />
            <SerpList />
            
            <!-- Related Searches (Inline đơn giản) -->
            <section class="bento-card p-6">
                <h3 class="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    Pivot Ideas <span class="text-xs font-normal text-subtle">(Google Related Searches)</span>
                </h3>
                <div class="flex flex-wrap gap-2.5">
                    {#each ['free time tracking app for freelancers', 'simple time tracking app', 'time tracking online'] as tag}
                        <span class="cursor-pointer px-4 py-2 bg-card border border-border hover:border-accent/40 hover:bg-card/80 rounded-full text-xs md:text-sm text-gray-300 hover:text-white">
                            {tag}
                        </span>
                    {/each}
                </div>
            </section>

             <!-- Quick Action -->
             <section class="bento-card p-5 border border-border bg-card/90">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <p class="text-[10px] font-mono text-subtle uppercase tracking-[0.18em] mb-1">Quick Action</p>
                        <h3 class="text-sm font-semibold text-white">Copy SERP context for AI</h3>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
                        <span class="text-xs">✨</span>
                    </div>
                </div>
                <p class="text-xs text-subtle mb-4">
                    Grab a ready-made context skeleton (keyword + SERP + forums), paste it into your own AI.
                </p>
                <div class="flex flex-col gap-2">
                    <button class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-black text-[11px] font-mono hover:bg-emerald-400 hover:shadow-soft">
                        <span class="text-xs">📋</span> <span>Copy SERP context</span>
                    </button>
                    <button class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-[11px] font-mono text-subtle hover:border-accent/60 hover:text-white hover:bg-card/80">
                        <span class="text-xs">🧾</span> <span>Export PDF report</span>
                    </button>
                </div>
            </section>
        </div>

        <!-- COL RIGHT -->
        <Sidebar />
    </div>
</div>
