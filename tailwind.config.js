/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 微信风格的绿色主题
        wechat: {
          50: '#f0f9f4',
          100: '#d9f2e3',
          200: '#b3e5c7',
          300: '#7ed4a1',
          400: '#4aba7d',
          500: '#07c160', // 微信主绿色
          600: '#059a4d',
          700: '#047a3d',
          800: '#045f31',
          900: '#034e28',
        },
      },
    },
  },
  plugins: [],
}

