<script lang="ts">
    export let verdict: any = null;
    export let targets: any = [];

    function handleCopyToLLM() {
        console.log("TODO: Copy logic");
    }

    function handleDownload() {
        console.log("TODO: Download logic");
    }
</script>

<section class="bento-card p-4">
    <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-mono text-subtle uppercase tracking-widest">Actions</span>
    </div>
    
    <p class="text-[10px] text-subtle mb-4 leading-relaxed opacity-80">
        Export this analysis or use AI to brainstorm specific micro-SaaS ideas based on the data.
    </p>
    
    <div class="flex flex-col gap-3">
        <button 
            on:click={handleCopyToLLM}
            class="w-full flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white transition-all group"
        >
            <div class="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 group-hover:border-accent/50 transition-colors">
                <svg class="w-4 h-4 text-subtle group-hover:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <div class="text-left">
                <span class="block text-xs font-medium text-gray-200 group-hover:text-white">Copy to LLM</span>
                <span class="block text-[9px] text-subtle">Generate ideas with AI</span>
            </div>
        </button>

        <button 
            on:click={handleDownload}
            class="w-full flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white transition-all group"
        >
            <div class="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 group-hover:border-blue-400/50 transition-colors">
                <svg class="w-4 h-4 text-subtle group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            </div>
            <div class="text-left">
                <span class="block text-xs font-medium text-gray-200 group-hover:text-white">Download Report</span>
                <span class="block text-[9px] text-subtle">Save as PDF</span>
            </div>
        </button>
    </div>
</section>
