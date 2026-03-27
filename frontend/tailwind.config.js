/** @type {import('tailwindcss').Config} */
const { Colors } = require("./constants/theme.cjs");

module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: { light: Colors.light.primary, dark: Colors.dark.primary },
        success: { light: Colors.light.success, dark: Colors.dark.success },
        danger: { light: Colors.light.danger, dark: Colors.dark.danger },
        card: { light: Colors.light.card, dark: Colors.dark.card },
        border: { light: Colors.light.border, dark: Colors.dark.border },
        text: { light: Colors.light.text, dark: Colors.dark.text },
        background: {
          light: Colors.light.background,
          dark: Colors.dark.background,
        },
        icon: { light: Colors.light.icon, dark: Colors.dark.icon },
        tint: { light: Colors.light.tint, dark: Colors.dark.tint },
        subtext: { light: Colors.light.subtext, dark: Colors.dark.subtext },
        input: { light: Colors.light.input, dark: Colors.dark.input },
      },
    },
  },
  darkMode: "class",
};
