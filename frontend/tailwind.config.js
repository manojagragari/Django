/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // ✅ must be "class" for manual toggle
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
