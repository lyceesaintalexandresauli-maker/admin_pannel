/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wall-yellow': '#b24d12',
        brand: "#E6C56A",
        brandDark: "#d6b04c",
      },
    },
  },
  plugins: [],
  experimental: {
    optimizeUniversalDefaults: true
  },
  future: {
    hoverOnlyWhenSupported: true,
  }
}
