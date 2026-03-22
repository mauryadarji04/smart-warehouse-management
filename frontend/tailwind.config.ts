import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        success: {
          50: '#ECFDF5',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          50: '#FFFBEB',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        danger: {
          50: '#FEF2F2',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        neutral: {
          500: '#64748B',
          600: '#475569',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E293B',
        },
        warehouse: {
          dark: '#0F172A',
          mid: '#1E293B',
          accent: '#F59E0B',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        fab: '0 8px 25px -5px rgb(59 130 246 / 0.5)',
      },
      animation: {
        'pulse-once': 'pulse-once 0.6s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
