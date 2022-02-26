import preactRefresh from '@prefresh/vite'
// import nodePolyfills from 'rollup-plugin-polyfill-node'
import { defineConfig } from 'vite'
import WindiCSS from 'vite-plugin-windicss'
// console.log(process.env);

export default defineConfig({
  server: {
    port: 3030,
    hmr: {
      overlay: false,
    },
    // cors: {
    //   allowedHeaders: '* ',
    // },
    // },o
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    target: 'esnext',
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
    preactRefresh({
      // exclude: [
      //   'src/Data/WebWorker.ts',

      // ],
    }),
    WindiCSS({ safelist: 'prose prose-sm m-auto' }),
    // comlink(),
    // pluginHelper(),
    // worker({}),
    // pluginHelper(),
    // worker({
    //   // All options with default values
    //   inline_worklet_paint: false,
    //   inline_worklet_audio: false,
    //   inline_worklet_layout: false,
    //   inline_worklet_animation: false,
    //   service_worker_file: 'sw.js',
    // }),
    // nodePolyfills(),
    // VitePWA({
    //   mode: 'development',
    //   filename: './Data/ServiceWorker.ts',
    // }),
    //   includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    //   manifest: {
    //     name: 'offline-sync',
    //     short_name: 'offline-sync',
    //     description: 'sync',
    //     theme_color: '#ffffff',
    //     icons: [
    //       {
    //         src: 'public/tick-box-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'public/tick-box-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'public/tick-box-512x512_maskable.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable',
    //       },
    //     ],
    //   },
    // }),

  ],
  define: {
    'process.env': process?.env || { isDev: import.meta.env.DEV }, // needed in addition to nodePolyfills
    // 'globalThis.Buffer': Buffer, // maybe needed in addition to nodePolyfills
    // Buffer, // maybe needed in addition to nodePolyfills
  },
})
