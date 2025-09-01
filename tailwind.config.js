/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#165DFF',
        secondary: '#0FC6C2',
        success: '#00B42A',
        danger: '#F53F3F',
        warning: '#FF7D00',
        info: '#86909C',
        light: '#F2F3F5',
        dark: '#1D2129',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
