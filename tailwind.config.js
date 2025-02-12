/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./projects/**/src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0a4f9d',
        'secondary': '#343836',
        'tertiary':'#FBFDFE',
        'chipPurple':'#A59EFB',
        'chipRejected':'#FD6969',
        'chipPublished':'#008840',
        'numberCircle': '#EC555D',
        'chipInprogress': '#FEEC8C',
        "chipBorder":'#9FA9C2',
        "chipComment":"#7AB4EE",
        "borderGray":"#d1d3d5",
        "blueCircle":"#8AA7C1",
        "cardLightBlue":"#f3f7fa",
        "lightGreen":"#07BC81",
        "iconGray":"#80868b",
        "chipPending":"#c99700",
        "error":"#ff3333"
      },
      width: {
        '47%': '47%',
      },
      spacing: {
        '28rem': '28rem',
      },
    },
  },
  plugins: [],
}
