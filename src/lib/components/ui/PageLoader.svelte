<script lang="ts">
    import { navigating } from '$app/stores';
    import { fade } from 'svelte/transition';

    // Khi $navigating có giá trị (khác null), tức là đang chuyển trang
</script>

{#if $navigating}
    <div 
        transition:fade={{ duration: 100 }}
        class="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-zinc-800 overflow-hidden"
    >
        <div class="h-full bg-accent animate-progress origin-left"></div>
    </div>
    
    <div 
        transition:fade 
        class="fixed inset-0 bg-bg/20 backdrop-blur-[1px] z-[90] pointer-events-none"
    ></div>
{/if}

<style>
    @keyframes progress {
        0% { transform: scaleX(0); }
        50% { transform: scaleX(0.5); }
        100% { transform: scaleX(0.9); } /* Không bao giờ full 100% cho đến khi xong */
    }
    .animate-progress {
        animation: progress 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
</style>
