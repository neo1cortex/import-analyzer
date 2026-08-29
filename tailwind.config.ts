import type { Config } from 'tailwindcss';

export default {
  content: ['./popup.html', './sidepanel.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
