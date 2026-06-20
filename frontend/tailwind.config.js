/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        moonDust: {
          light:   '#D3D3FF',  // Base Light / Accent 1
          violet:  '#CEB5FF',  // Soft Violet / Accent 2
          sky:     '#8EC1DE',  // Muted Sky / Accent 3
          primary: '#80A8FF',  // Bright Cornflower / Primary
        },
        canvas: '#0B0C16',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '0.6' },
          '50%':       { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(128,168,255,0.3)' },
          '50%':       { boxShadow: '0 0 40px rgba(128,168,255,0.6)' },
        },
        rudenessBar: {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--rudeness-width)' },
        },
        scoreCount: {
          '0%':   { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer:    'shimmer 2s ease-in-out infinite',
        fadeInUp:   'fadeInUp 0.4s ease-out both',
        glow:       'glow 3s ease-in-out infinite',
        rudenessBar:'rudenessBar 1s ease-out forwards',
        scoreCount: 'scoreCount 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
