<script lang="ts">
    const currentYear = new Date().getFullYear();
</script>

<footer class="border-t border-border bg-bg/50 backdrop-blur-sm mt-auto">
    <div class="max-w-custom mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div class="text-[11px] text-zinc-600 font-mono">
            &copy; {currentYear} NicheRadar.
        </div>

        <div class="flex items-center gap-6">
            <a href="/privacy" class="text-[11px] text-subtle hover:text-white transition-colors">Privacy</a>
            <a href="/terms" class="text-[11px] text-subtle hover:text-white transition-colors">Terms</a>
        </div>
        
    </div>
</footer>
