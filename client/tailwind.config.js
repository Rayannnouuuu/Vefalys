/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Police et palette portees telles quelles depuis vefalys.fr (assets/css/style.css)
        // pour que le CRM partage l'identite visuelle exacte du site vitrine.
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', '"Iowan Old Style"', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        // Vert foret Vefalys - valeurs 500-950 identiques a --forest-* sur vefalys.fr ;
        // 50-400 interpoles depuis --bg/--bg-dim pour obtenir une rampe Tailwind complete.
        brand: {
          50: '#faf8f2',
          100: '#f1ede1',
          200: '#ddd6c0',
          300: '#a9b09c',
          400: '#6f8a74',
          500: '#3c7154',
          600: '#2d5c44',
          700: '#234a36',
          800: '#1a3a2a',
          900: '#132a1d',
          950: '#0c1a12',
        },
        // Or discret - identique a --amber/--amber-soft sur vefalys.fr (400/100), reste interpole.
        accent: {
          50: '#faf6ed',
          100: '#e4d4ab',
          200: '#d7c08a',
          300: '#c9ac6a',
          400: '#b8944f',
          500: '#a67f3f',
          600: '#8a6a34',
          700: '#6e5529',
        },
      },
      boxShadow: {
        // Memes valeurs que --shadow-sm/md/lg sur vefalys.fr
        subtle: '0 2px 10px rgba(19, 42, 29, 0.06)',
        card: '0 12px 32px rgba(19, 42, 29, 0.10)',
        lifted: '0 24px 64px rgba(19, 42, 29, 0.16)',
      },
      borderRadius: {
        // Tailwind "lg" (8px par defaut) correspond deja exactement a --radius-sm du site
        // (utilise pour boutons/champs) : volontairement laisse tel quel. Seul "xl" (cartes/
        // modales) est ajuste pour correspondre a --radius-md (14px).
        xl: '14px',
      },
    },
  },
  plugins: [],
}
