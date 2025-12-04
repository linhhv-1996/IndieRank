<script lang="ts">
    import type { AppItem } from '$lib/types';
    export let apps: AppItem[] = [];
    export let sponsor: any = null;
    const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-white">
            {apps.every(a => a.type === 'resource') ? 'Curated Resources' : 'Market Leaders'}
        </h2>
    </div>

    <div class="grid grid-cols-1 gap-4">
        {#each apps as app}
            <div class="bento-card p-5 group hover:bg-zinc-800/30 transition-all flex gap-4 md:gap-5 items-start relative cursor-pointer">
                
                <div class="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700/50 p-2 flex items-center justify-center">
                    <img src={getFavicon(app.domain)} alt={app.name} class="w-8 h-8 md:w-10 md:h-10 object-contain rounded-sm opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>

                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-base font-semibold text-gray-200 group-hover:text-white transition-colors relative z-10">
                                <a href={app.url} target="_blank" rel="noopener noreferrer">{app.name}</a>
                            </h3>
                            
                            <a href={app.url} target="_blank" rel="nofollow" class="text-[11px] text-zinc-500 hover:underline truncate block max-w-[200px] relative z-10">
                                {app.domain}
                            </a>
                        </div>
                        
                        <a href={app.url} target="_blank" rel="noopener noreferrer" 
                           class="relative z-10 hidden md:flex px-3 py-1.5 border text-xs font-medium rounded-lg transition-all items-center gap-1.5
                           {app.type === 'resource' 
                               ? 'bg-transparent text-subtle border-zinc-700 hover:text-white hover:border-white' 
                               : 'bg-zinc-800 text-white border-zinc-700 hover:bg-white hover:text-black hover:border-white'}"> 
                            {app.ctaText} 
                            <span class="text-[10px] opacity-60">↗</span>
                        </a>
                    </div>

                    <p class="text-sm text-subtle mt-2 line-clamp-2 leading-relaxed group-hover:text-zinc-300 transition-colors">
                        {app.description}
                    </p>

                    <div class="flex items-center gap-2 mt-3">
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border 
                            {app.type === 'app' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                             app.type === 'template' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                             'bg-zinc-800 text-zinc-500 border-zinc-700'}">
                            {app.type}
                        </span>

                        {#each app.tags as tag}
                            <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                                {tag}
                            </span>
                        {/each}
                    </div>
                </div>
                
                <a href={app.url} target="_blank" rel="noopener noreferrer" class="absolute inset-0 z-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50">
                    <span class="sr-only">View {app.name}</span>
                </a>
            </div>
        {/each}
    </div>
</div>
