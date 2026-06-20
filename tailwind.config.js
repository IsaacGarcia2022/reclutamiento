/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        brand: {
          50: '#eefaf8', 100: '#d5f2ef', 200: '#abe5de', 300: '#7bd2c8',
          400: '#4dbdb0', 500: '#26a698', 600: '#0d8c81', 700: '#0a6e65',
          800: '#0a5851', 900: '#094a44'
        },
        coral: {
          50: '#fdf3ef', 100: '#fae1d7', 200: '#f4c3af', 300: '#ed9e7f',
          400: '#e67852', 500: '#e85c3e', 600: '#cc4623', 700: '#aa371d',
          800: '#8c2d1a', 900: '#742718'
        },
        stone: {
          50: '#faf9f7', 100: '#f2f0ed', 200: '#e6e2dc', 300: '#cbc4ba',
          400: '#a69b8e', 500: '#857a6d', 600: '#685f54', 700: '#4f483f',
          800: '#39342e', 900: '#25211d'
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.02)' }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' }
        }
      }
    }
  },
  plugins: []
}
