const c = (v) => `rgb(var(--c-${v}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dusk"]'],
  theme: {
    extend: {
      colors: {
        paper: c('paper'),
        surface: c('surface'),
        ink: c('ink'),
        muted: c('muted'),
        line: c('line'),
        wine: c('wine'),
        'wine-deep': c('wine-deep'),
        rose: c('rose'),
        blush: c('blush'),
        gold: c('gold'),
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        script: ['"Caveat"', 'cursive'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--c-shadow) / 0.05), 0 8px 24px -8px rgb(var(--c-shadow) / 0.12)',
        lift: '0 2px 4px rgb(var(--c-shadow) / 0.06), 0 18px 40px -12px rgb(var(--c-shadow) / 0.22)',
        glow: '0 0 0 4px rgb(var(--c-rose) / 0.25)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        floatUp: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0' },
          '15%': { opacity: '0.7' },
          '100%': { transform: 'translateY(-110vh) scale(1.1)', opacity: '0' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        flash: { '0%': { opacity: '0.95' }, '100%': { opacity: '0' } },
      },
      animation: {
        floatUp: 'floatUp 14s linear infinite',
        shimmer: 'shimmer 1.6s infinite',
        flash: 'flash 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
