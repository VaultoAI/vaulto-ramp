/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'loading-dot': {
          '0%, 60%, 100%': { opacity: '0.3' },
          '30%': { opacity: '1' },
        },
      },
      animation: {
        'loading-dot': 'loading-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

