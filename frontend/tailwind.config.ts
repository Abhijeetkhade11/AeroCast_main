import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#060b14',
        deep: '#080f1d',
        surface: '#0d1628',
        elevated: '#111e35',
        panel: '#162240',
        border: 'rgba(99, 132, 195, 0.12)',
        sky: '#3d7eff',
        'sky-dim': 'rgba(61, 126, 255, 0.15)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'flight-path': 'flight-path 8s linear infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'shimmer': 'skeleton-shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-sky': 'linear-gradient(135deg, #3d7eff, #06b6d4)',
      },
    },
  },
  plugins: [],
};

export default config;
