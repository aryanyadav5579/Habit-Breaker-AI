/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#07111f",
        panel: "#101c2f",
        line: "#26364d",
        mint: "#2dd4bf",
        leaf: "#22c55e",
        sun: "#f59e0b",
        danger: "#ef4444"
      },
      boxShadow: {
        glow: "0 18px 70px rgba(45, 212, 191, 0.12)",
        "glow-lg": "0 24px 90px rgba(45, 212, 191, 0.20)",
        "card": "0 4px 24px rgba(0, 0, 0, 0.4)"
      },
      backgroundOpacity: {
        8: "0.08"
      },
      animation: {
        fadein: "fadein 0.4s ease both",
        "pulse-ring": "pulse-ring 1.5s ease-out infinite"
      },
      keyframes: {
        fadein: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};
