// js/tailwind.config.js
// Rôle : étend Tailwind avec les tokens de design du projet
// (couleurs, polices, animations personnalisées)

tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body:    ['Jost', 'sans-serif'],
      },
      colors: {
        gold: {
          DEFAULT: '#c9a96e',
          light:   '#dfc08a',
        },
      },
      animation: {
        'fade-in':  'fadeIn 0.35s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                           to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
}
