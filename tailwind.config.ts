import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MindPath AI brand colors
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b8fd',
          400: '#818cf8',
          500: '#6366f1',  // primary
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Subject colors
        math:    { light: '#FFF3E0', DEFAULT: '#FF9800', dark: '#E65100' },
        reading: { light: '#E8F5E9', DEFAULT: '#4CAF50', dark: '#1B5E20' },
        science: { light: '#E3F2FD', DEFAULT: '#2196F3', dark: '#0D47A1' },
        vocab:   { light: '#F3E5F5', DEFAULT: '#9C27B0', dark: '#4A148C' },
        writing: { light: '#FFF8E1', DEFAULT: '#FFC107', dark: '#FF6F00' },
        // Gamification
        xp:      '#FFD700',
        streak:  '#FF6B35',
        badge:   { common: '#94A3B8', rare: '#3B82F6', epic: '#8B5CF6', legendary: '#F59E0B' },
        // Status
        success: '#22C55E',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#3B82F6',
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card':    '0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.04)',
        'card-lg': '0 8px 32px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.04)',
        'glow':    '0 0 24px rgba(99,102,241,0.3)',
        'xp':      '0 0 16px rgba(255,215,0,0.4)',
        'streak':  '0 0 16px rgba(255,107,53,0.4)',
      },
      animation: {
        'float':        'float 3s ease-in-out infinite',
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'bounce-light': 'bounce 1s ease-in-out 3',
        'slide-up':     'slideUp 0.3s ease-out',
        'slide-down':   'slideDown 0.3s ease-out',
        'scale-in':     'scaleIn 0.2s ease-out',
        'confetti':     'confetti 0.6s ease-out forwards',
        'xp-pop':       'xpPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.9)' }, to: { opacity: '1', transform: 'scale(1)' } },
        xpPop:     { '0%': { opacity: '0', transform: 'scale(0.5) translateY(0)' }, '60%': { opacity: '1', transform: 'scale(1.2) translateY(-20px)' }, '100%': { opacity: '0', transform: 'scale(1) translateY(-40px)' } },
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}

export default config
