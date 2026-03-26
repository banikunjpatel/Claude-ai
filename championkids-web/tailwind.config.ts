import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ck: {
          primary: {
            50:  '#FAF5FC',
            100: '#F2E5F7',
            200: '#E4CBF0',
            300: '#CE9EE0',
            400: '#B871CF',
            500: '#9C51B6',
            600: '#7E3D96',
            700: '#612E75',
            800: '#452054',
            900: '#2C1436',
          },
          neutral: {
            0:   '#FFFFFF',
            50:  '#FAFAFA',
            100: '#F5F5F5',
            200: '#E8E8E8',
            300: '#D4D4D4',
            400: '#A3A3A3',
            500: '#737373',
            700: '#404040',
            900: '#171717',
          },
          success: '#16A34A',
          warning: '#D97706',
          error:   '#DC2626',
          info:    '#2563EB',
        },
        skill: {
          communication:            '#9C51B6',
          leadership:               '#D97706',
          'critical-thinking':      '#2563EB',
          creativity:               '#DB2777',
          resilience:               '#16A34A',
          'social-skills':          '#EA580C',
          'emotional-intelligence': '#0891B2',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'ck-sm': '0 1px 3px rgba(156, 81, 182, 0.08)',
        'ck-md': '0 4px 16px rgba(156, 81, 182, 0.12)',
        'ck-lg': '0 8px 32px rgba(156, 81, 182, 0.18)',
      },
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '16px',
        xl:   '24px',
        full: '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
