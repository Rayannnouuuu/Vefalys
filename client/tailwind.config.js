/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        // Vert Vefalys - couleur de marque principale
        brand: {
          50: '#f2f8f4',
          100: '#e1f0e6',
          200: '#c3e0cd',
          300: '#9bcaac',
          400: '#6fb085',
          500: '#4c9468',
          600: '#397a52',
          700: '#2e6243',
          800: '#274f37',
          900: '#20412e',
          950: '#11241a',
        },
        // Or discret - accents et touche premium
        accent: {
          50: '#faf6ed',
          100: '#f3e9d0',
          200: '#e6d09f',
          300: '#d7b56e',
          400: '#c9a04d',
          500: '#b3863a',
          600: '#93692f',
          700: '#735129',
        },
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(17 36 26 / 0.04), 0 1px 3px 0 rgb(17 36 26 / 0.06)',
        card: '0 2px 8px -2px rgb(17 36 26 / 0.08), 0 1px 2px -1px rgb(17 36 26 / 0.04)',
      },
    },
  },
  plugins: [],
}
