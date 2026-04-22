/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        accent: "rgb(37, 183, 187)",
        "bg-dark": "#112F3D",
        "card-dark": "rgb(30, 41, 59)",
        muted: "#8BA3A7",
        soft: "#E7EAE8",
        purple: "#8B6FC0",
        orange: "#E8904F",
      },
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
