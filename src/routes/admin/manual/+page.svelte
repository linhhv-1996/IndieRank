<script lang="ts">
    import { enhance } from '$app/forms';
    
    // Hứng dữ liệu trả về từ server (file +page.server.ts)
    export let form: {
        success?: boolean;
        error?: string;
        promptApps?: string;
        promptReport?: string;
        keyword?: string;
    };

    let isLoading = false;
</script>

<div class="manual-container">
    
    <form 
        method="POST" 
        action="?/generate_prompts" 
        class="manual-form"
        use:enhance={() => {
            isLoading = true;
            return async ({ update }) => {
                isLoading = false;
                await update(); 
            };
        }}
    >
        <input type="hidden" name="country" value="us" />

        <div class="form-group">
            <label for="keyword">Nhập Keyword (Đã scan database)</label>
            <input
                id="keyword"
                name="keyword"
                type="text"
                placeholder="Ví dụ: best seo tools..."
                required
            />
        </div>

        <button type="submit" disabled={isLoading} class="submit-btn">
            {#if isLoading}
                <span class="loader"></span> Đang tạo Prompts...
            {:else}
                Generate Prompts
            {/if}
        </button>
    </form>

    {#if form?.error}
        <div class="error-box">
            <strong>Lỗi:</strong> {form.error}
        </div>
    {/if}

    {#if form?.success}
        <div class="result-box">
            <h3 class="success-title">✅ Đã tạo prompt cho: "{form.keyword}"</h3>
            
            <div class="prompt-section">
                <div class="prompt-header">
                    <h4>Prompt 1: Processed Apps</h4>
                    <button class="copy-btn" on:click={() => navigator.clipboard.writeText(form.promptApps || '')}>Copy</button>
                </div>
                <textarea readonly rows="10">{form.promptApps}</textarea>
            </div>

            <div class="prompt-section">
                <div class="prompt-header">
                    <h4>Prompt 2: Market Report</h4>
                    <button class="copy-btn" on:click={() => navigator.clipboard.writeText(form.promptReport || '')}>Copy</button>
                </div>
                <textarea readonly rows="10">{form.promptReport}</textarea>
            </div>
        </div>
    {/if}
</div>

<style>
    /* CSS THUẦN - KHÔNG CẦN THƯ VIỆN */
    .manual-container {
        width: 100%;
        max-width: 800px; /* Rộng hơn chút để chứa Prompt */
        margin: 20px auto;
        padding: 24px;
        background-color: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        font-family: system-ui, -apple-system, sans-serif;
    }

    .manual-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    label {
        font-weight: 600;
        margin-bottom: 8px;
        display: block;
        color: #374151;
    }

    input[type="text"] {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 16px;
        box-sizing: border-box;
    }

    input:focus {
        outline: 2px solid #2563eb;
        border-color: #2563eb;
    }

    .submit-btn {
        width: 100%;
        padding: 12px;
        background-color: #2563eb;
        color: white;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
    }

    .submit-btn:disabled {
        background-color: #93c5fd;
        cursor: not-allowed;
    }

    /* ERROR BOX */
    .error-box {
        margin-top: 16px;
        padding: 12px;
        background-color: #fee2e2;
        border: 1px solid #f87171;
        color: #b91c1c;
        border-radius: 8px;
    }

    /* RESULT BOX */
    .result-box {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 2px dashed #e5e7eb;
    }

    .success-title {
        color: #059669;
        margin-top: 0;
    }

    .prompt-section {
        margin-top: 20px;
    }

    .prompt-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .prompt-header h4 {
        margin: 0;
        color: #4b5563;
    }

    .copy-btn {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }
    .copy-btn:active { background: #e5e7eb; }

    textarea {
        width: 100%;
        padding: 12px;
        background-color: #1e293b; /* Màu tối code editor */
        color: #e2e8f0;
        font-family: monospace;
        border-radius: 8px;
        border: 1px solid #334155;
        resize: vertical;
        box-sizing: border-box;
        font-size: 13px;
        line-height: 1.5;
    }

    /* LOADER */
    .loader {
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-bottom-color: transparent;
        border-radius: 50%;
        animation: rotation 1s linear infinite;
    }
    @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
