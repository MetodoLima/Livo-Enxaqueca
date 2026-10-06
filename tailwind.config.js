/** @type {import('tailwindcss').Config} */
const palette = require('./constants/colors.json');

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: Object.fromEntries(
        Object.entries(palette).map(([nome, cor]) => [nome.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`), cor]),
      ),
      fontFamily: {
        epilogue: ["Epilogue_400Regular"],
        "epilogue-light": ["Epilogue_300Light"],
        "epilogue-medium": ["Epilogue_500Medium"],
        "epilogue-semi": ["Epilogue_600SemiBold"],
        "epilogue-bold": ["Epilogue_700Bold"],
      },
    },
  },
  plugins: [],
};
