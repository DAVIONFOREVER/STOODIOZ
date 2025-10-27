/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'zinc-950': '#09090b',
        'zinc-900': '#18181b',
        'zinc-800': '#27272a',
        'zinc-700': '#3f3f46',
        'zinc-400': '#a1a1aa',
        'zinc-200': '#e4e4e7',
        'orange-500': '#f97316',
        'orange-400': '#fb923c',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      animation: {
        'gradient-flow': 'gradient-flow 4s ease infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'blink': 'blink 1.2s infinite steps(1, start)',
      },
       keyframes: {
        'gradient-flow': {
            '0%, 100%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
            'from': { opacity: 0 },
            'to': { opacity: 1 },
        },
        'fade-in-up': {
            'from': { opacity: 0, transform: 'translateY(20px)' },
            'to': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-up': {
            'from': { opacity: 0, transform: 'translateY(30px)' },
            'to': { transform: 'translateY(0)', opacity: 1 },
        },
        'blink': {
          '0%, 100%': { 'background-color': 'transparent' },
          '50%': { 'background-color': '#f97316' },
        },
      }
    },
  },
  plugins: [],
}