<script lang="ts">
    import { auth, googleProvider } from '$lib/firebase.client';
    import { signInWithPopup } from 'firebase/auth';
    import { goto, invalidateAll } from '$app/navigation';
    import { page } from '$app/stores';

    let isLoading = false;
    let errorMsg = '';

    // Nếu đã login rồi thì đá về trang chủ hoặc trang trước đó
    $: if ($page.data.user) {
        goto('/');
    }

    async function handleLogin() {
        isLoading = true;
        errorMsg = '';
        
        try {
            // 1. Popup Google Client
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            // 2. Gửi Token về Server tạo Session
            const res = await fetch('/api/session', {
                method: 'POST',
                body: JSON.stringify({ idToken }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                await invalidateAll(); // Reload dữ liệu server
                goto('/analyze'); // Chuyển hướng vào app chính
            } else {
                errorMsg = 'Failed to create session on server.';
            }
        } catch (error: any) {
            console.error(error);
            errorMsg = error.message || 'Login failed. Please try again.';
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
    <div class="hero-orbit"></div>
    
    <div class="w-full max-w-md bento-card p-8 md:p-10 relative z-10 shadow-2xl border-zinc-800/80 bg-card/95 backdrop-blur-sm">
        
        <div class="flex flex-col items-center mb-8">
            <div class="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-black font-bold font-mono text-xl shadow-glow mb-4">
                N
            </div>
            <h1 class="text-2xl font-semibold text-white tracking-tight">Welcome back</h1>
            <p class="text-sm text-subtle mt-2 text-center">
                Sign in to access your market intelligence dashboard.
            </p>
        </div>

        {#if errorMsg}
            <div class="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {errorMsg}
            </div>
        {/if}

        <div class="space-y-4">
            <button 
                on:click={handleLogin}
                disabled={isLoading}
                class="w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
                {#if isLoading}
                    <span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                    <span>Signing in...</span>
                {:else}
                    <svg class="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Continue with Google</span>
                {/if}
            </button>

            <div class="relative flex py-2 items-center">
                <div class="flex-grow border-t border-border"></div>
                <span class="flex-shrink-0 mx-4 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">or</span>
                <div class="flex-grow border-t border-border"></div>
            </div>

            <a href="/" class="block text-center text-xs text-subtle hover:text-white transition-colors">
                ← Back to landing page
            </a>
        </div>
    </div>

    <div class="absolute bottom-6 text-[10px] text-zinc-600 font-mono">
        &copy; 2025 NICHERADAR. SECURE LOGIN.
    </div>
</div>
