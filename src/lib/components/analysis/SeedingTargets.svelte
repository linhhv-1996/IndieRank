<script lang="ts">
    import type { SeedingTarget } from '$lib/types';

    export let targets: SeedingTarget[] = [];
</script>

<section class="bento-card p-0 overflow-hidden">
    <div class="px-4 py-3 border-b border-border flex justify-between items-center bg-card/90">
        <div>
            <h3 class="text-[10px] font-mono text-subtle uppercase tracking-widest">Seeding Targets</h3>
            <p class="text-[10px] text-subtle mb-0 leading-relaxed opacity-80">Hijack conversations</p>
        </div>
        <span class="text-[10px] bg-zinc-800 border border-border px-1.5 py-0.5 rounded-full font-mono text-subtle">
            {targets.length}
        </span>
    </div>

    <div class="divide-y divide-border">
        {#if targets.length === 0}
            <div class="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div class="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <span class="text-xl opacity-40 grayscale">🏜️</span>
                </div>
                <p class="text-xs text-subtle">No organic discussions found</p>
            </div>
        {:else}
            {#each targets as item}
                <a href={item.url} target="_blank" rel="noopener noreferrer" class="block px-4 py-3 group seed-row hover:bg-zinc-900/50 transition-colors">
                    <div class="flex items-start gap-3">
                        <div class="w-5 pt-0.5 flex justify-center shrink-0">
                            {#if item.source === 'Reddit'}
                                <svg class="w-4 h-4 text-[#FF4500]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
                            {:else if item.source === 'Quora'}
                                <span class="font-serif text-base font-bold text-[#B92B27] leading-none">Q</span>
                            {:else}
                                <span class="text-base grayscale opacity-70">💬</span>
                            {/if}
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <div class="flex flex-wrap items-center gap-1.5 mb-0.5">
                                <span class="text-[10px] font-bold" 
                                    class:text-[#FF4500]={item.source === 'Reddit'} 
                                    class:text-[#B92B27]={item.source === 'Quora'}>
                                    {item.source}
                                </span>
                                {#if item.meta}
                                    <span class="text-[9px] text-subtle font-mono truncate max-w-[120px]">• {item.meta}</span>
                                {/if}
                            </div>
                            
                            <div class="text-xs text-gray-200 font-medium line-clamp-2 group-hover:text-accent group-hover:underline decoration-accent/50 underline-offset-2 leading-snug">
                                {item.title}
                            </div>
                        </div>

                        {#if item.isHijackable}
                            <div class="shrink-0 pt-1">
                                <span title="Hijack Opportunity" class="flex items-center justify-center w-5 h-5 rounded-full border border-zinc-700 text-[10px] text-subtle group-hover:border-white group-hover:text-white transition-colors">
                                    🎯
                                </span>
                            </div>
                        {/if}
                    </div>
                </a>
            {/each}
        {/if}
    </div>
</section>
