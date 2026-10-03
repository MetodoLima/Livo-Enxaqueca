/** @type {import('tailwindcss').Config} */
const palette = require('./constants/colors.json');

const kebab = (nome) => nome.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);

const group = (cores, prefixo = '') =>
  Object.fromEntries(Object.entries(cores).map(([nome, cor]) => [`${prefixo}${kebab(nome)}`, cor]));

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
      colors: {
        ...group(palette.roles),
        ...group(palette.pain, 'pain-'),
        ...group(palette.mood, 'mood-'),
        ...group(palette.legacy),
      },
      fontSize: {
        caption: ["13px", { lineHeight: "18px" }],
        body: ["16px", { lineHeight: "24px" }],
        heading: ["18px", { lineHeight: "24px" }],
        title: ["24px", { lineHeight: "30px" }],
        display: ["32px", { lineHeight: "38px" }],
        hero: ["48px", { lineHeight: "52px" }],
      },
      fontFamily: {
        epilogue: ["Epilogue_400Regular"],
        "epilogue-light": ["Epilogue_300Light"],
        "epilogue-medium": ["Epilogue_500Medium"],
        "epilogue-semi": ["Epilogue_600SemiBold"],
        "epilogue-bold": ["Epilogue_700Bold"],
      },
      spacing: {
        gutter: "24px",
        section: "32px",
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",
      },
    },
  },
  plugins: [],
};
