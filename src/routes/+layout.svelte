<script>
    import { page } from '$app/stores';
    import "../app.css";
    import Header from "$lib/components/layout/Header.svelte";
    import PageLoader from "$lib/components/ui/PageLoader.svelte";

   // @ts-ignore
     $: isLoginPage = $page.url.pathname === '/login';
</script>


<PageLoader />


{#if !isLoginPage}
    <Header />
{/if}

<!-- Nội dung thay đổi của từng trang -->
<main class="flex-grow flex flex-col">
    <slot />
</main>

<!-- Footer (nếu cần thêm sau này) -->
<!-- <Footer /> -->
 