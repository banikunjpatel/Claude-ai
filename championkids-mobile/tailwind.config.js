/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
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
      },
      fontFamily: {
        sans:     ['PlusJakartaSans_400Regular'],
        medium:   ['PlusJakartaSans_500Medium'],
        semibold: ['PlusJakartaSans_600SemiBold'],
        bold:     ['PlusJakartaSans_700Bold'],
      },
      borderRadius: {
        sm:   6,
        md:   10,
        lg:   16,
        xl:   24,
        full: 9999,
      },
    },
  },
  plugins: [],
}
