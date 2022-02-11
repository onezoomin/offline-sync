import preactRefresh from '@prefresh/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import WindiCSS from 'vite-plugin-windicss'

export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    target: 'es2020',
  },
  resolve: {
    alias: [
      { find: 'react', replacement: 'preact/compat' },
      { find: 'react-dom', replacement: 'preact/compat' },
    ],
  },
  plugins: [preactRefresh(), VitePWA(), WindiCSS({ safelist: 'prose prose-sm m-auto' })],
})
