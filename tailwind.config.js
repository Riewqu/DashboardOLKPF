/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      animation: {
        "slide-down": "slide-down 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "text-shimmer": "text-shimmer 3s linear infinite",
      },
      keyframes: {
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "text-shimmer": {
          "0%": {
            "background-size": "200% auto",
            "background-position": "0% center",
          },
          "100%": {
            "background-size": "200% auto",
            "background-position": "200% center",
          },
        },
      },
    },
  },
  plugins: [],
};
