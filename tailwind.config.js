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
          // Azul petróleo: identidad y acciones principales
          50: '#edf4f6', 100: '#d7e6eb', 200: '#b2ccd5', 300: '#86adba',
          400: '#5e8291', 500: '#367084', 600: '#18566b', 700: '#134858',
          800: '#103b4a', 900: '#0b2e39'
        },
        coral: {
          // Dorado suave: acentos y llamadas de atención
          50: '#fdf9f1', 100: '#f8efd9', 200: '#f0ddb4', 300: '#e2c480',
          400: '#d3ad62', 500: '#c79a52', 600: '#ad7e3d', 700: '#8f6532',
          800: '#73512d', 900: '#604427'
        },
        stone: {
          // Neutros azulados: superficies, bordes y tipografía
          50: '#f4f7f8', 100: '#e8eef0', 200: '#d7e0e3', 300: '#bdcbd0',
          400: '#96a8ae', 500: '#65757c', 600: '#526168', 700: '#404e54',
          800: '#334046', 900: '#263238'
        },
        sage: {
          50: '#f1f5f3', 100: '#dfe9e4', 200: '#c5d6ce', 300: '#a1bcae',
          400: '#81a18f', 500: '#638579', 600: '#4f6c61', 700: '#40584f',
          800: '#344840', 900: '#2b3c35'
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
