/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Nền tối nhưng có chiều sâu (Zinc-950)
        bg: '#09090b', 
        // Card sáng hơn nền một chút (Zinc-900)
        card: '#18181b',
        // Border nhạt và tinh tế hơn (Zinc-800)
        border: '#27272a',
        // Màu chữ phụ sáng hơn để dễ đọc (Zinc-400)
        subtle: '#a1a1aa',
        // Màu Accent giữ nguyên hoặc chỉnh tươi hơn một chút
        accent: '#22c55e', 
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      maxWidth: {
        custom: '1200px'
      },
      boxShadow: {
        // Shadow mượt hơn cho các thành phần nổi
        soft: '0 20px 40px -10px rgba(0,0,0,0.5)',
        glow: '0 0 20px rgba(34, 197, 94, 0.15)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
