/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/*.{js,ts,jsx,tsx}",
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
        'rotate-background': 'rotate-background 120s linear infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-up': 'slide-up 0.5s ease-out forwards',
      },
      keyframes: {
        'gradient-flow': {
            '0%, 100%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
        },
        'rotate-background': {
            'from': { transform: 'translate(-50%, -50%) rotate(0deg)' },
            'to': { transform: 'translate(-50%, -50%) rotate(360deg)' },
        },
        'fade-in': {
            'to': { opacity: '1' },
        },
        'fade-in-up': {
            'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
            'to': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}