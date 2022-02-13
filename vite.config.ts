import preactRefresh from '@prefresh/vite'
// import nodePolyfills from 'rollup-plugin-polyfill-node'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import WindiCSS from 'vite-plugin-windicss'

// console.log(process.env);

export default defineConfig({
  server: {
    port: 3030,
    cors: {
      allowedHeaders: '*',
    },
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    target: 'es2020',
  },
  resolve: {
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  plugins: [
    preactRefresh(),
    // nodePolyfills(),
    VitePWA(),
    WindiCSS({ safelist: 'prose prose-sm m-auto' }),
  ],
  define: {
    'process.env': process?.env || { isDev: import.meta.env.DEV }, // needed in addition to nodePolyfills
    // 'globalThis.Buffer': Buffer, // maybe needed in addition to nodePolyfills
    // Buffer, // maybe needed in addition to nodePolyfills
  },
})
