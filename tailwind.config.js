/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:     '#2D4459',
          teal:     '#3BBFBF',
          mint:     '#C8E8E5',
          coral:    '#F05F57',
          burnt:    '#C8613F',
          blush:    '#E8A99A',
          slate:    '#7A8F95',
          cream:    '#FEFAF5',
          offwhite: '#F4F7F8',
        }
      }
    }
  },
  plugins: []
}
