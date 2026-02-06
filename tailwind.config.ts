import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Samsara Primary Colors
        navy: {
          DEFAULT: '#00263E',
          50: '#e6f0f5',
          100: '#cce1eb',
          200: '#99c3d7',
          300: '#66a5c3',
          400: '#3387af',
          500: '#00699b',
          600: '#00547c',
          700: '#003f5d',
          800: '#00263E',
          900: '#001929',
        },
        // Pulse blue - refined accent color
        pulse: {
          50: '#eff8ff',
          100: '#dbeefe',
          200: '#bfe0fe',
          300: '#93ccfd',
          400: '#60b0fa',
          500: '#3b93f5',
          600: '#2575ea',
          700: '#1d5fd7',
          800: '#1e4eae',
          900: '#1e4289',
          950: '#172a54',
        },
        'electric-blue': '#0369EA',
        // Secondary Colors
        'light-blue': '#ACBEFF',
        'asphalt-gray': '#333333',
        'snow': '#F0F6FE',
      },
      fontFamily: {
        sans: ['Inter', 'InterVariable', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'InterVariable', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'InterVariable', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      letterSpacing: {
        headline: '-0.03em',
        tag: '0.01em',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 38, 62, 0.08), 0 4px 6px -4px rgba(0, 38, 62, 0.05)',
        'soft-lg': '0 10px 25px -5px rgba(0, 38, 62, 0.08), 0 8px 10px -6px rgba(0, 38, 62, 0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
