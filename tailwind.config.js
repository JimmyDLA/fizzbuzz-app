/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    "bg-[#02D9EE]",
    "bg-[#019CAB]",
    "bg-[#FE559D]",
    "bg-[#B73D71]",
    "bg-[#F7C133]",
    "bg-[#B28B25]",
    "bg-[#C6FB2D]",
    "bg-[#8FB520]",
    "bg-[#AE48FC]",
    "bg-[#7D34B5]",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
