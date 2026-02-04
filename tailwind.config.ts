import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette violette principale
        primary: {
          50: '#f5f2ff',
          100: '#ede8ff',
          200: '#e6ddff',
          300: '#c9b8ff',
          400: '#a78bff',
          500: '#8b5cf6',
          600: '#7645fb',
          700: '#6530e0',
          800: '#5426bc',
          900: '#46209a',
          950: '#2c1168',
        },
        // Couleurs du design system
        accent: {
          DEFAULT: '#7645fb',
          light: '#e6ddff',
          orange: '#fba045',
        },
        kopro: {
          cream: '#fafbfd',
          dark: '#212121',
          white: '#ffffff',
          required: '#f16161',
          grey: '#bcbcbc',
          purple: '#e6ddff',
          success: '#1cc562',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'input': '0 0 0 0 rgba(210, 149, 221, 0), -0.2px 2.3px 3px 0 rgba(210, 149, 221, 0.02), -0.5px 4.6px 6px 0 rgba(210, 149, 221, 0.024), -0.7px 7.1px 9px 0 rgba(210, 149, 221, 0.027), -2.9px 29.2px 26.1px 0 rgba(210, 149, 221, 0.03), -4px 39.7px 30.9px 0 rgba(210, 149, 221, 0.03), -5.8px 57.2px 37.1px 0 rgba(210, 149, 221, 0.035), -9.4px 92.7px 47.1px 0 rgba(210, 149, 221, 0.035)',
        'button': '0 0 1em -0.3em rgba(250, 251, 253, 0.68) inset, 0 1.7px 6.9px 0 rgba(78, 27, 81, 0.07), 0 3.8px 14.1px 0 rgba(78, 27, 81, 0.082), 0 7.1px 22.1px 0 rgba(78, 27, 81, 0.086), 0 15px 33.1px 0 rgba(78, 27, 81, 0.094)',
        'button-hover': 'none',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'input': '0.6em',
        'button': '8em',
      },
    },
  },
  plugins: [],
}

export default config
