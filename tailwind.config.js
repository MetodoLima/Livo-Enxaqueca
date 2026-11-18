/** @type {import('tailwindcss').Config} */
const palette = require('./constants/colors.json');

const kebab = (nome) => nome.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);

const group = (cores, prefixo = '') =>
  Object.fromEntries(Object.entries(cores).map(([nome, cor]) => [`${prefixo}${kebab(nome)}`, cor]));

// Cores temáticas: o valor vem de variáveis CSS (canais RGB) definidas por tema
// em constants/temas.ts, o que mantém os modificadores de opacidade (bg-pain-3/30).
const tematico = (cores, prefixo = '') =>
  Object.fromEntries(
    Object.keys(cores).map((nome) => {
      const token = `${prefixo}${kebab(nome)}`;
      return [token, `rgb(var(--c-${token}) / <alpha-value>)`];
    }),
  );

const { scrim, ...papeis } = palette.roles;

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
        ...tematico(papeis),
        scrim,
        ...tematico(palette.pain, 'pain-'),
        ...tematico(palette.mood, 'mood-'),
        ...group(palette.legacy),
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
