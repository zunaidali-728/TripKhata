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
        // Dark theme - Forest Green
        'forest': {
          950: '#081713',
          900: '#0D211B',
          800: '#122A22',
          700: '#18352A',
          600: '#1F4333',
          500: '#294237',
        },
        // Accent colors
        'emerald-accent': '#65C98B',
        'amber-accent': '#E6B878',
        // Status colors
        'status-positive': '#65C98B',
        'status-negative': '#E07B6A',
        'status-neutral': '#A8B8AD',
        'status-pending': '#E6B878',
      },
      fontFamily: {
        'display': ['Playfair Display', 'Georgia', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-forest': 'linear-gradient(135deg, #081713 0%, #122A22 50%, #18352A 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(18,42,34,0.9) 0%, rgba(24,53,42,0.8) 100%)',
      },
    },
  },
  plugins: [],
}
