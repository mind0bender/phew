import type { Config } from 'tailwindcss'
import { stone, amber, emerald } from "tailwindcss/colors"

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors:{
        primary: emerald,
        secondary: stone,
        tertiary: amber,
      },
    },
  },
  plugins: [],
} satisfies Config

