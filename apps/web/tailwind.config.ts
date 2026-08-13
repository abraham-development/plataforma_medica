import type { Config } from 'tailwindcss'
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#123047',
        ocean: '#156b85',
        mint: '#0f9f83',
        cloud: '#f3f8fa',
        coral: '#f07167',
      },
      boxShadow: { soft: '0 18px 55px rgba(22, 74, 93, .12)' },
    },
  },
  plugins: [],
} satisfies Config
