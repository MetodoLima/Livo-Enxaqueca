/** @type {import('tailwindcss').Config} */
const palette = require('./constants/colors.json');

const kebab = (nome) => nome.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);

const parseColor = (cor) => {
  if (cor.startsWith('rgba')) {
    const m = cor.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (m) return { rgb: `${m[1]} ${m[2]} ${m[3]}`, alpha: parseFloat(m[4]) };
  }
  const clean = cor.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return { rgb: `${r} ${g} ${b}`, alpha: 1 };
};

const runtimeColor = (token, cor) => {
  const { rgb, alpha } = parseColor(cor);
  return `rgb(var(--color-${token}-rgb, ${rgb}) / calc(var(--color-${token}-alpha, ${alpha}) * <alpha-value>))`;
};

const group = (cores, prefixo = '') =>
  Object.fromEntries(
    Object.entries(cores).map(([nome, cor]) => {
      const token = `${prefixo}${kebab(nome)}`;
      return [token, runtimeColor(token, cor)];
    })
  );

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
