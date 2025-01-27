/** @type {import('tailwindcss').Config} */
export default {
  content: ["./**/*.{html,js}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      orange: {
        DEFAULT: "#f97316",
        hover: "#ea580c",
      },
      green: "#22c55e",
      gray: {
        100: "#f3f4f6",
        200: "#eaecef",
        300: "#e2e5e9",
        400: "#dadde2",
        500: "#878c97",
        600: "#323c4c",
        700: "#2d3747",
        800: "#252f3d",
        900: "#1f2937",
      },
    },
    extend: {},
  },
  darkMode: "class",
  plugins: [],
};
