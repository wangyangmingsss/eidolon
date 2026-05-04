import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#f3ead4',
        ink: '#2b1d10',
        ember: '#c2410c',
        ash: '#7a6f5d',
      },
      fontFamily: {
        serif: ['"IM Fell English"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
