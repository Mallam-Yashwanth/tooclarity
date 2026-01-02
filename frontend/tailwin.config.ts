import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        roobert: ['"Roobert TRIAL"', "sans-serif"],
        maven: ['var(--font-maven-pro)'],
      },
    },
  },
  plugins: [],
}
export default config
