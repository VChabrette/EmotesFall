/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'accent': 'var(--accent-color)',
        'secondary': 'var(--secondary-color)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
        '6xl': '4rem',
      },
    },
    fontFamily: {
      title: ['"PP Pier Sans"']
    }
  },
  plugins: [],
}

