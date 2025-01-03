/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        highlight: "#00aab0",
        lightBg: "#e6f4f1",
        accent: "#e2ffff",
        'dark-bg': '#121212', // Dark background color
        'dark-text': '#e5e7eb', // Lighter text color in dark mode
        'background-dark': '#1a202c', // Custom dark background color
        'background-light': '#f7fafc', // Custom light background color
      },
    },
  },
  plugins: [],
};
