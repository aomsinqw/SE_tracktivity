/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        customColor1: "#1AC8DB", // Replace with your colors
        customColor2: "#FF6347", // Example additional color
        customColor3: "#FFD700", // Example additional color
      },
    },
  },
  plugins: [require("daisyui")],
};
