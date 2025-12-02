<script lang="ts">
    import type { Verdict } from '$lib/types';
    
    export let verdict: Verdict;

    // Helper xác định màu sắc
    const getColorClasses = (color: string) => {
        switch (color) {
            case 'green':
                return {
                    bg: 'bg-accent/10',
                    border: 'border-accent/40',
                    text: 'text-accent',
                    glow: 'bg-accent/10',
                    indicator: 'bg-accent shadow-[0_0_10px_rgba(34,197,94,0.6)]'
                };
            case 'yellow':
                return {
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/40',
                    text: 'text-yellow-500',
                    glow: 'bg-yellow-500/10',
                    indicator: 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]'
                };
            case 'red':
            default:
                return {
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/40',
                    text: 'text-red-400',
                    glow: 'bg-red-500/5',
                    indicator: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                };
        }
    };

    $: styles = getColorClasses(verdict.color);
</script>

<section class="bento-card p-6 relative overflow-hidden group">
    <div class="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-colors duration-500 {styles.glow}"></div>

    <div class="relative z-10 space-y-4">
        <div class="flex items-center justify-between">
            <h3 class="text-[11px] font-mono text-subtle uppercase tracking-[0.18em]">Market Verdict</h3>
            <span class="px-2.5 py-0.5 border text-[10px] font-mono rounded-full uppercase transition-colors font-semibold {styles.border} {styles.bg} {styles.text}">
                {verdict.status}
            </span>
        </div>

        <div class="flex items-center gap-3">
            <h4 class="text-2xl md:text-3xl font-bold text-white">{verdict.title}</h4>
            <span class="w-3 h-3 rounded-full animate-pulse {styles.indicator}"></span>
        </div>

        <div class="text-sm text-subtle leading-relaxed max-w-3xl">
            {@html verdict.description}
        </div>
    </div>
</section>
