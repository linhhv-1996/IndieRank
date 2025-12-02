<script>
    // Component Sidebar bên phải (Upsell + Stack)
</script>

<aside class="lg:col-span-4 space-y-6 sticky-sidebar">
    <!-- Upsell Banner -->
    <section class="bento-card p-4 border border-border/70 bg-card/80 hover:border-accent/50 cursor-pointer">
        <p class="text-[11px] text-subtle mb-1">Sell to this audience?</p>
        <p class="text-xs font-medium text-white mb-1">Sponsor the “Time Tracking” report</p>
        <p class="text-[11px] text-subtle">From <span class="text-accent font-semibold">$50/mo</span> • 100+ scans / month</p>
    </section>

    <!-- Recommended Stack -->
    <section class="bento-card p-5">
        <div class="flex items-center justify-between mb-4">
            <div>
                <span class="text-[10px] font-mono text-subtle uppercase tracking-[0.18em]">Recommended Stack</span>
                <p class="text-xs text-subtle mt-1">Opinionated setup to ship v1 fast.</p>
            </div>
            <div class="w-7 h-7 rounded-full bg-card flex items-center justify-center border border-border">
                <span class="text-[10px] font-mono text-subtle">v1</span>
            </div>
        </div>

        <div class="space-y-3">
            <!-- Hosting -->
            <div class="flex items-start gap-3 p-2.5 rounded-lg bg-card/80 hover:bg-card/95 cursor-pointer">
                <div class="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-soft">
                    <svg class="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0L1.6 6v12L12 24l10.4-6V6L12 0zm0 2.3l8 4.6v9.2l-8 4.6-8-4.6V6.9l8-4.6z" />
                    </svg>
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-xs font-semibold text-white">Vercel</div>
                            <div class="text-[11px] text-subtle">Host the landing + app. Auto-deploy from Git.</div>
                        </div>
                        <span class="text-[10px] font-mono text-subtle">Hosting</span>
                    </div>
                </div>
            </div>

            <!-- Database -->
            <div class="flex items-start gap-3 p-2.5 rounded-lg bg-card/80 hover:bg-card/95 cursor-pointer">
                <div class="w-8 h-8 bg-emerald-400/20 rounded-md flex items-center justify-center">
                    <div class="w-4 h-4 bg-emerald-400 transform rotate-45 rounded-sm"></div>
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-xs font-semibold text-white">Supabase</div>
                            <div class="text-[11px] text-subtle">Store scans, users, and credits in Postgres.</div>
                        </div>
                        <span class="text-[10px] font-mono text-subtle">Database</span>
                    </div>
                </div>
            </div>

            <!-- More items (Clerk, shadcn, Serp) reduced for brevity but structured similarly -->
             <div class="flex items-start gap-3 p-2.5 rounded-lg bg-card/80 hover:bg-card/95 cursor-pointer">
                <div class="w-8 h-8 rounded-md border border-border flex items-center justify-center">
                    <span class="text-[11px] font-mono text-subtle">Clerk</span>
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-xs font-semibold text-white">Clerk / Auth.js</div>
                            <div class="text-[11px] text-subtle">Auth for indie buyers.</div>
                        </div>
                        <span class="text-[10px] font-mono text-subtle">Auth</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</aside>
