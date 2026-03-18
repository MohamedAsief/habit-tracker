/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        accent: '#7c6aff',
        lime:   '#b8ff6a',
        ember:  '#ff6b4a',
        muted:  '#8b8b9e',
        border: '#2a2a35',
        card:   '#18181f',
        surface:'#111118',
        void:   '#0a0a0f',
      },
      animation: {
        'slide-up': 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':  'fadeIn 0.2s ease',
      },
      keyframes: {
        slideUp: { from: { transform: 'translateY(18px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
      },
    },
  },
  plugins: [],
}
