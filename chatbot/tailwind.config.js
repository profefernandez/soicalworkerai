/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ember: {
          base: '#1A1614',
          surface: '#2A2421',
          primary: '#E8913A',
          secondary: '#C4785C',
          safe: '#7BA68C',
          crisis: '#D94F4F',
          text: '#F0EBE3',
          muted: '#A89B8C',
        },
      },
      fontFamily: {
        heading: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-crisis': 'pulse-crisis 2s ease-in-out infinite',
        glow: 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-crisis': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(217, 79, 79, 0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(217, 79, 79, 0.8)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 8px rgba(232, 145, 58, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(232, 145, 58, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
