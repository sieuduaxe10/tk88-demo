import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        casino: {
          red: '#DC143C',
          'red-dark': '#8B0000',
          gold: '#FFD700',
          'gold-dark': '#B8860B',
          black: '#0D0D0D',
          card: '#1F1F1F',
          muted: '#B0B0B0',
          'muted-dark': '#6B6B6B',
          accent: '#FF4757',
          success: '#22C55E',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Be Vietnam Pro', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(255, 215, 0, 0.4)',
        'red-glow': '0 0 20px rgba(220, 20, 60, 0.5)',
        'card-hover': '0 10px 30px -5px rgba(0, 0, 0, 0.8)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'red-gradient': 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
        'cta-gradient': 'linear-gradient(135deg, #FFD700 0%, #DC143C 100%)',
        'casino-bg': 'linear-gradient(135deg, #1a0b0b 0%, #2a0a0a 50%, #0D0D0D 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
