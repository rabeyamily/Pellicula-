/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"Special Elite"', 'Courier New', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        film: {
          black: '#0d0b09',
          brown: '#2a1f14',
          sepia: '#8b6914',
          cream: '#f0e6c8',
          ivory: '#faf4e1',
          amber: '#c8862a',
          rust: '#9b3a1a',
          silver: '#b8a898',
        },
      },
    },
  },
  plugins: [],
}
