import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0a0118',
        steel: '#1a1a2e',
        neon: '#00f0ff',
        rose: '#ff2a6d',
        amber: '#fcee0a',
        haze: '#5b6788',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
        display: ['"Orbitron"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 12px rgba(0, 240, 255, 0.5), 0 0 24px rgba(0, 240, 255, 0.25)',
        rose: '0 0 12px rgba(255, 42, 109, 0.5)',
      },
    },
  },
  plugins: [],
};
export default config;
