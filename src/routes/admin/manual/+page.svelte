<script lang="ts">
    import { enhance } from '$app/forms';
    
    export let form: {
        slug?: string;
        success?: boolean;
        promptApps?: string;
        promptReport?: string; // Đã thêm cái này
        seedingTargetsJson?: string;
        rawResponse?: string;
        error?: string;
    };

    let isLoading = false;
    let copiedSection: string | null = null;

    const copyToClipboard = (text: string, section: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        copiedSection = section;
        setTimeout(() => copiedSection = null, 2000);
    };
</script>

<div class="max-w-5xl mx-auto py-10 px-4">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h1 class="text-2xl font-bold text-white tracking-tight">Manual Analyzer</h1>
            <p class="text-xs text-zinc-500 mt-1 font-mono">Powered by Brave Search API</p>
        </div>
        <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-xs font-mono text-zinc-400">System Ready</span>
        </div>
    </div>

    <section class="bento-card p-6 border border-zinc-700 bg-zinc-900/50 mb-8">
        <form 
            method="POST" 
            action="?/process_serp" 
            class="flex flex-col md:flex-row gap-4 items-end"
            use:enhance={() => {
                isLoading = true;
                return async ({ update }) => {
                    isLoading = false;
                    await update();
                };
            }}
        >
            <div class="flex-grow w-full">
                <label for="keyword" class="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                    Keyword to Analyze
                </label>
                <div class="relative">
                    <input 
                        id="keyword" 
                        name="keyword" 
                        type="text" 
                        required 
                        placeholder="e.g. ai headshot generator free"
                        class="w-full bg-black/50 border border-zinc-700 rounded-lg pl-4 pr-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-zinc-700 font-medium"
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isLoading} 
                class="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 shrink-0 min-w-[140px]"
            >
                {#if isLoading}
                    <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Running...</span>
                {:else}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <span>Analyze</span>
                {/if}
            </button>
        </form>
        
        {#if form?.error}
            <div class="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded font-mono">
                Error: {form.error}
            </div>
        {/if}
    </section>

    {#if form?.success}
        <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div class="flex items-center gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                </div>
                <div>
                    <span class="text-[10px] text-blue-300 uppercase tracking-wider font-bold block mb-0.5">Database Slug</span>
                    <code class="text-base font-bold text-white font-mono select-all">{form.slug}</code>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <h3 class="text-sm font-bold text-white flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-400"></span> 
                            1. Seeding Targets (JSON)
                        </h3>
                        <button 
                            class="text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                            on:click={() => copyToClipboard(form.seedingTargetsJson || '', 'seeding')}
                        >
                            {#if copiedSection === 'seeding'}
                                <span class="text-emerald-400">✓ Copied</span>
                            {:else}
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                <span>Copy JSON</span>
                            {/if}
                        </button>
                    </div>
                    <textarea 
                        readonly 
                        class="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[10px] font-mono text-emerald-100/70 focus:outline-none resize-none scrollbar-thin"
                    >{form.seedingTargetsJson}</textarea>
                </div>

                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <h3 class="text-sm font-bold text-white flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-amber-400"></span> 
                            2. Prompt 1: Apps List
                        </h3>
                        <button 
                            class="text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                            on:click={() => copyToClipboard(form.promptApps || '', 'prompt')}
                        >
                            {#if copiedSection === 'prompt'}
                                <span class="text-emerald-400">✓ Copied</span>
                            {:else}
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                <span>Copy Prompt</span>
                            {/if}
                        </button>
                    </div>
                    <div class="relative group h-64">
                        <textarea 
                            readonly 
                            class="w-full h-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[10px] font-mono text-zinc-400 focus:text-zinc-200 focus:outline-none resize-none scrollbar-thin transition-colors"
                        >{form.promptApps}</textarea>
                        <div class="absolute bottom-3 right-3 px-2 py-1 bg-zinc-900/90 border border-zinc-700 rounded text-[9px] text-zinc-500 font-mono pointer-events-none">
                            Paste to AI -> processed_apps
                        </div>
                    </div>
                </div>

                <div class="space-y-3 lg:col-span-2">
                    <div class="flex justify-between items-center">
                        <h3 class="text-sm font-bold text-white flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-purple-400"></span> 
                            3. Prompt 2: Market Report
                        </h3>
                        <button 
                            class="text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                            on:click={() => copyToClipboard(form.promptReport || '', 'report')}
                        >
                            {#if copiedSection === 'report'}
                                <span class="text-emerald-400">✓ Copied</span>
                            {:else}
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                <span>Copy Prompt</span>
                            {/if}
                        </button>
                    </div>
                    <div class="relative group h-48">
                        <textarea 
                            readonly 
                            class="w-full h-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[10px] font-mono text-zinc-400 focus:text-zinc-200 focus:outline-none resize-none scrollbar-thin transition-colors"
                        >{form.promptReport}</textarea>
                        <div class="absolute bottom-3 right-3 px-2 py-1 bg-zinc-900/90 border border-zinc-700 rounded text-[9px] text-zinc-500 font-mono pointer-events-none">
                            Paste to AI -> market_report
                        </div>
                    </div>
                </div>

            </div>

            <details class="group bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden">
                <summary class="cursor-pointer p-3 text-xs font-mono text-zinc-500 hover:text-zinc-300 flex items-center justify-between select-none bg-zinc-900/50">
                    <span class="flex items-center gap-2">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                        Raw Brave Response (Debug)
                    </span>
                    <span class="opacity-50 group-open:opacity-100 transition-opacity text-[10px]">+ Expand</span>
                </summary>
                <div class="p-0 border-t border-zinc-800/50 relative">
                    <button 
                        class="absolute top-2 right-2 text-[9px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 hover:text-white z-10"
                        on:click={() => copyToClipboard(form.rawResponse || '', 'raw')}
                    >
                        {copiedSection === 'raw' ? 'Copied!' : 'Copy Raw JSON'}
                    </button>
                    <textarea 
                        readonly 
                        rows="10" 
                        class="w-full bg-black/50 border-none p-3 text-[10px] font-mono text-zinc-600 focus:outline-none"
                    >{form.rawResponse}</textarea>
                </div>
            </details>

        </div>
    {/if}
</div>
