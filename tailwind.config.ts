import type { Config } from 'tailwindcss'
import { slate, amber, emerald } from "tailwindcss/colors"

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors:{
        primary: emerald,
        secondary: slate,
        tertiary: amber,
      },
    },
  },
  plugins: [],
} satisfies Config

