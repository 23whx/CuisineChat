/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 「深夜食堂」設計：暗色底 + 燈籠琥珀 + 暖簾紅（只有暗色，沒有亮色模式）
      colors: {
        night: {
          DEFAULT: '#15110e', // 頁面背景
          surface: '#1d1814', // 頂欄、輸入區
          field: '#231c17', // 輸入框
          raised: '#2a221c', // 對方的氣泡、標籤
          line: '#2e2620', // 分隔線
          border: '#3a2e25', // 輸入框描邊
        },
        ink: {
          DEFAULT: '#f3e7d6',
          muted: '#9c8b78',
          soft: '#c9a77c',
        },
        lantern: {
          light: '#f7b85b',
          DEFAULT: '#f2a541',
          dark: '#e2902a',
          ink: '#1d1209', // 琥珀底上的文字
        },
        noren: {
          DEFAULT: '#d64933',
          cloth: '#3b1a16',
          deep: '#24120f',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'system-ui', '-apple-system', '"PingFang SC"', '"Hiragino Sans"', '"Apple SD Gothic Neo"', 'sans-serif'],
        serif: ['"Noto Serif TC"', '"Noto Serif JP"', '"Songti SC"', 'serif'],
      },
      boxShadow: {
        glow: '0 0 18px -4px rgba(242, 165, 65, 0.7)',
        'glow-lg': '0 10px 30px -10px rgba(242, 165, 65, 0.8)',
        bubble: '0 6px 22px -8px rgba(242, 165, 65, 0.55)',
        lantern: '0 0 60px rgba(242, 165, 65, 0.55)',
      },
    },
  },
  plugins: [],
}
