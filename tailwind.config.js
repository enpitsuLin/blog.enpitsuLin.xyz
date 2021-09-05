const colors = require('tailwindcss/colors');

module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    themeVariants: ['dark'],
    colors: {
      ...colors,
      primary: {
        100: '#66c6c6',
        200: '#32b3b3',
        300: '#19a9a9',
        400: '#00a0a0',
        500: '#008080',
        600: '#006060',
        700: '#004040',
        800: '#003030',
        900: '#002020',
        DEFAULT: '#00a0a0'
      },
      secondary: {
        DEFAULT: '#05c7c7'
      },
      blackBrown: {
        100: '#8D8B8C',
        200: '#5F5D5E',
        300: '#474546',
        400: '#302e2f',
        500: '#1a1719',
        DEFAULT: '#1a1719'
      },
      coffee: {
        DEFAULT: '#433A3F'
      },
      skobeloff: {
        DEFAULT: '#156363'
      },
      error: { DEFAULT: '#a00000' },
      transparent: '#0000'
    },
    extend: {}
  },
  variants: {
    backgroundColor: ['responsive', 'hover', 'focus', 'dark'],
    textColor: ['responsive', 'hover', 'focus', 'dark'],
    extend: {}
  },
  plugins: [require('tailwindcss-multi-theme')]
};
