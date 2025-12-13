<script lang="ts">
    import type { Verdict } from '$lib/types';
    
    export let verdict: Verdict;
    export let url: string = ''; 
    export let cta: string = 'Visit Website'; 

    // Helper: Thêm state group-hover cho button để di chuột vào Card là nút sáng luôn
    const getColorClasses = (color: string) => {
        switch (color) {
            case 'green':
                return {
                    bg: 'bg-accent/10',
                    border: 'border-accent/40',
                    text: 'text-accent',
                    glow: 'bg-accent/10',
                    indicator: 'bg-accent shadow-[0_0_10px_rgba(34,197,94,0.6)]',
                    btn: 'bg-accent group-hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] border-transparent'
                };
            case 'yellow':
                return {
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/40',
                    text: 'text-yellow-500',
                    glow: 'bg-yellow-500/10',
                    indicator: 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]',
                    btn: 'bg-yellow-500 group-hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] border-transparent'
                };
            case 'red':
            default:
                return {
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/40',
                    text: 'text-red-400',
                    glow: 'bg-red-500/5',
                    indicator: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]',
                    btn: 'bg-red-600 group-hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] border-transparent'
                };
        }
    };

    $: styles = getColorClasses(verdict.color);
</script>

<svelte:element 
    this={url ? 'a' : 'section'} 
    href={url || null}
    target={url ? '_blank' : null}
    rel={url ? 'noopener noreferrer nofollow' : null}
    class="bento-card p-5 relative overflow-hidden group flex flex-col h-full {url ? 'cursor-pointer' : ''}"
> 
    <div class="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none transition-colors duration-500 {styles.glow}"></div>

    <div class="relative z-10 space-y-3 flex-1"> 
        <div class="flex items-center justify-between">
            <h3 class="text-[10px] font-mono text-subtle uppercase tracking-widest">Market Snapshot</h3>
            <span class="px-2 py-0.5 border text-[9px] font-mono rounded-full uppercase transition-colors font-semibold {styles.border} {styles.bg} {styles.text}">
                {verdict.status}
            </span>
        </div>

        <div class="flex items-start gap-2"> 
            <h4 class="text-lg font-bold text-white leading-tight">{verdict.title}</h4> 
            <span class="w-2 h-2 rounded-full animate-pulse mt-1.5 shrink-0 {styles.indicator}"></span>
        </div>

        <div class="text-xs text-subtle leading-relaxed break-words"> 
            {@html verdict.description}
        </div>
    </div>

    {#if url}
        <div class="relative z-10 mt-5 pt-4 border-t border-white/5">
            <div 
                class="
                    w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg 
                    text-xs font-bold uppercase tracking-wider 
                    transition-all duration-200 
                    border 
                    {styles.btn}
                "
            >
                {cta}
                <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
        </div>
    {/if}
</svelte:element>
