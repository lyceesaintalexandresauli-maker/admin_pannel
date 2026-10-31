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
