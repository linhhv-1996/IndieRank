<script lang="ts">
    import { enhance } from '$app/forms';
    
    export let form: {
        slug?: string;
        success?: boolean;
        promptApps?: string;
        promptReport?: string;
        promptAlternatives?: string; // Mới
        seedingTargetsJson?: string;
    };

    let isLoading = false;
    
    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        alert('Copied!');
    };
</script>

<div class="manual-container">
    <h1 class="text-2xl font-bold mb-6">Manual SERP Processor</h1>
    
    <form 
        method="POST" 
        action="?/process_serp" 
        class="manual-form"
        use:enhance={() => {
            isLoading = true;
            return async ({ update }) => {
                isLoading = false;
                await update(); 
            };
        }}
    >
        <div class="form-group">
            <label for="keyword">Keyword</label>
            <input id="keyword" name="keyword" type="text" required class="border p-2 rounded w-full"/>
        </div>

        <div class="form-group">
            <label for="rawJson">Raw SERP JSON</label>
            <textarea id="rawJson" name="rawJson" rows="3" required class="border p-2 rounded w-full"></textarea>
        </div>

        <button type="submit" disabled={isLoading} class="bg-blue-600 text-white p-3 rounded font-bold">
            {isLoading ? 'Processing...' : 'Process Data'}
        </button>
    </form>

    {#if form?.success}
        <div class="mt-8 space-y-8">

            <div class="bg-yellow-50 p-4 border border-yellow-200 rounded shadow-sm">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-yellow-800">🔑 Slug (Document ID)</h3>
                    <button class="text-xs bg-white border border-yellow-300 px-3 py-1 rounded hover:bg-yellow-100 font-medium" 
                        on:click={() => copyToClipboard(form.slug || '')}>Copy Slug</button>
                </div>
                <div class="w-full text-lg font-mono font-bold text-yellow-900 bg-white p-2 border border-yellow-300 rounded select-all">
                    {form.slug}
                </div>
            </div>
            
            <div class="bg-green-50 p-4 border border-green-200 rounded">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-green-800">✅ BE Logic: Seeding Targets (Copy JSON)</h3>
                    <button class="text-xs bg-white border px-3 py-1 rounded shadow-sm hover:bg-gray-50" 
                        on:click={() => copyToClipboard(form.seedingTargetsJson || '')}>Copy JSON</button>
                </div>
                <textarea readonly rows="4" class="w-full text-xs font-mono p-2 border rounded">{form.seedingTargetsJson}</textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-indigo-50 p-4 border border-indigo-200 rounded">
                    <div class="flex justify-between items-center mb-2">
                        <label class="block font-bold text-indigo-700 text-sm">Prompt 1: processed_apps </label>
                        <button class="text-xs bg-white border px-2 py-1 rounded" on:click={() => copyToClipboard(form.promptApps || '')}>Copy</button>
                    </div>
                    <textarea readonly rows="8" class="w-full text-xs font-mono p-2 border rounded">{form.promptApps}</textarea>
                </div>

                <div class="bg-indigo-50 p-4 border border-indigo-200 rounded">
                    <div class="flex justify-between items-center mb-2">
                        <label class="block font-bold text-indigo-700 text-sm">Prompt 2: market_report</label>
                        <button class="text-xs bg-white border px-2 py-1 rounded" on:click={() => copyToClipboard(form.promptReport || '')}>Copy</button>
                    </div>
                    <textarea readonly rows="8" class="w-full text-xs font-mono p-2 border rounded">{form.promptReport}</textarea>
                </div>

                <div class="bg-indigo-50 p-4 border border-indigo-200 rounded">
                    <div class="flex justify-between items-center mb-2">
                        <label class="block font-bold text-indigo-700 text-sm">Prompt 3: alternatives</label>
                        <button class="text-xs bg-white border px-2 py-1 rounded" on:click={() => copyToClipboard(form.promptAlternatives || '')}>Copy</button>
                    </div>
                    <textarea readonly rows="8" class="w-full text-xs font-mono p-2 border rounded">{form.promptAlternatives}</textarea>
                </div>
            </div>

        </div>
    {/if}
</div>

<style>
    .manual-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .manual-form { display: flex; flex-direction: column; gap: 15px; }
</style>
