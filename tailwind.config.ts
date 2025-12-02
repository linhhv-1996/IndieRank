import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				bg: '#050505',
				card: '#0B0B0B',
				border: '#262626',
				accent: '#22c55e',
				subtle: '#9CA3AF'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
			},
			maxWidth: {
				custom: '1100px'
			},
			boxShadow: {
				soft: '0 18px 45px rgba(0,0,0,0.55)'
			}
		}
	},
	plugins: []
} satisfies Config;
