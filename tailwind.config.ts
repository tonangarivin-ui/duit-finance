import type { Config } from 'tailwindcss';

/** Semua warna lewat CSS variable (RGB triplet) supaya tema bisa ditukar runtime. */
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('--c-bg'),
        card: v('--c-card'),
        chip: v('--c-chip'),
        line: v('--c-line'),
        ink: v('--c-ink'),
        dim: v('--c-dim'),
        gold: v('--c-gold'),
        income: v('--c-income'),
        expense: v('--c-expense'),
        amberish: v('--c-amberish'),
        onaccent: v('--c-onaccent'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
