/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm cream background tones
        cream: {
          50:  '#FFFEF9',
          100: '#FDF7EF',
          200: '#FAF0E0',
          300: '#F5E6D0',
          400: '#EDD9BC',
        },
        // Peach / terracotta accent
        peach: {
          50:  '#FDF2EC',
          100: '#FAE5D9',
          200: '#F5CDB8',
          300: '#EEAC88',
          400: '#E4895A',
          500: '#C87048',
          600: '#A85A35',
        },
        // Sage green secondary accent
        sage: {
          50:  '#F2F7F1',
          100: '#E4EEE2',
          200: '#C8DEC4',
          300: '#A4C69E',
          400: '#7EAB76',
          500: '#5E8E56',
          600: '#447040',
        },
        // Warm dark brown for text
        warm: {
          50:  '#F9F4F0',
          100: '#F0E6DD',
          200: '#DEC9B8',
          300: '#C4A48C',
          400: '#A07E60',
          500: '#7A5C40',
          600: '#5A3D28',
          700: '#3D2B1F',
          800: '#2A1D14',
          900: '#1A110C',
        },
      },
      fontFamily: {
        sans: ['Heebo', 'Arial', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft':    '0 2px 12px -2px rgba(61,43,31,0.08), 0 4px 16px -4px rgba(61,43,31,0.05)',
        'soft-md': '0 4px 20px -3px rgba(61,43,31,0.10), 0 8px 24px -4px rgba(61,43,31,0.07)',
        'soft-lg': '0 8px 30px -4px rgba(61,43,31,0.12), 0 16px 40px -8px rgba(61,43,31,0.08)',
        'card':    '0 1px 4px 0 rgba(61,43,31,0.08)',
        'card-hover': '0 6px 24px -4px rgba(61,43,31,0.14)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'spin-slow':  'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
