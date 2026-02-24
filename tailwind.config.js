/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#F5EDD9',
        'parchment-dark': '#E8D9BE',
        mahogany: '#1C0A00',
        'mahogany-light': '#3D1F0A',
        gold: '#C8922A',
        'gold-light': '#DEB654',
        'gold-pale': '#F0D89A',
        teal: '#4AADAA',
        'teal-dark': '#2A8B84',
        cream: '#FFF8EE',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        lora: ['Lora', 'serif'],
        raleway: ['Raleway', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
