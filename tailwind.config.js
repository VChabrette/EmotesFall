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
    },
    fontFamily: {
      title: ['"PP Pier Sans"']
    }
  },
  plugins: [],
}

