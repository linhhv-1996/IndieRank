<script lang="ts">
    import { enhance } from '$app/forms';

    export let form: {
        success?: boolean;
        error?: string;
        message?: string;
    };

    let isLoading = false;
</script>

<div class="max-w-4xl mx-auto py-10 px-4">
    <div class="mb-8 flex items-center justify-between">
        <h1 class="text-3xl font-bold text-white">Database Entry</h1>
        <a href="/admin/manual" class="text-sm text-blue-400 hover:underline">← Back to Generator</a>
    </div>

    {#if form?.error}
        <div class="p-4 mb-6 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            <strong>Lỗi:</strong> {form.error}
        </div>
    {/if}
    {#if form?.success}
        <div class="p-4 mb-6 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-200 flex items-center justify-between">
            <span>✅ {form.message}</span>
            <a href="/" class="text-xs bg-emerald-500 text-black px-3 py-1 rounded font-bold hover:bg-emerald-400">View Site</a>
        </div>
    {/if}

    <form 
        method="POST" 
        class="space-y-6"
        use:enhance={() => {
            isLoading = true;
            return async ({ update }) => {
                isLoading = false;
                await update();
            };
        }}
    >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="md:col-span-3">
                <label class="block text-sm font-medium text-gray-400 mb-1">Keyword (ID)</label>
                <input name="keyword" type="text" required placeholder="e.g. best pdf editor" 
                    class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white focus:border-emerald-500 outline-none" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Country</label>
                <input name="country" type="text" value="us" 
                    class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-center font-mono uppercase" />
            </div>
        </div>

        <div>
            <label class="block text-sm font-medium text-emerald-400 mb-1">
                Processed Apps JSON (Từ Prompt 1)
            </label>
            <textarea name="processed_apps" rows="6" 
                class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs font-mono text-gray-300 focus:border-emerald-500 outline-none"
                placeholder=''></textarea>
        </div>

        <div>
            <label class="block text-sm font-medium text-amber-400 mb-1">
                Market Report JSON (Từ Prompt 2)
            </label>
            <textarea name="market_report" rows="4" 
                class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs font-mono text-gray-300 focus:border-amber-500 outline-none"
                placeholder=''></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label class="block text-sm font-medium text-blue-400 mb-1">
                    Alternatives JSON (Từ Prompt 3 hoặc BE Logic)
                </label>
                <textarea name="alternatives" rows="5" 
                    class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs font-mono text-gray-300 focus:border-blue-500 outline-none"></textarea>
            </div>

            <div>
                <label class="block text-sm font-medium text-purple-400 mb-1">
                    Seeding Targets JSON (Từ BE Logic)
                </label>
                <textarea name="seeding_targets" rows="5" 
                    class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs font-mono text-gray-300 focus:border-purple-500 outline-none"></textarea>
            </div>
        </div>

        <details class="group">
            <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-300 select-none">
                ▶ Paste Raw SERP JSON (Optional - Backup)
            </summary>
            <div class="mt-2">
                <textarea name="raw_response" rows="3" 
                    class="w-full bg-zinc-900/50 border border-zinc-800 rounded p-2 text-[10px] font-mono text-gray-500"></textarea>
            </div>
        </details>

        <div class="pt-4 border-t border-zinc-800">
            <button type="submit" disabled={isLoading} 
                class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {#if isLoading}
                    <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Saving...
                {:else}
                    <span>💾 SAVE TO DATABASE</span>
                {/if}
            </button>
        </div>
    </form>
</div>
