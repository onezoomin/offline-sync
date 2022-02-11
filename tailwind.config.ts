import { defineConfig } from 'windicss/helpers'
import formsPlugin from 'windicss/plugin/forms'

export default defineConfig({
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    safeList: [],
    content: ['./index.html', './src/**/*.jsx', './src/**/*.js', './src/**/*.ts', './src/**/*.tsx'],
  },
  theme: {
    extend: {
      fontWeight: ['hover', 'focus'],
      colors: {
        teal: {
          100: '#096',
        },
      },
    },
  },
  variants: {},
  plugins: [formsPlugin],
})
