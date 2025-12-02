<script>
    import "../app.css";
    import Header from "$lib/components/layout/Header.svelte";
</script>

<Header />

<!-- Nội dung thay đổi của từng trang -->
<main class="flex-grow flex flex-col">
    <slot />
</main>

<!-- Footer (nếu cần thêm sau này) -->
<!-- <Footer /> -->
 