import { h, render } from 'preact'
import 'virtual:windi.css'
import { App } from './app'
import MyWorker from './Data/simple-worker?worker'
import './index.css'
const workerApi = new MyWorker()
console.log(workerApi)
workerApi.postMessage('ping') // ping ww with each app render

// async function createViteWorker () {
//   // TODO: the dynamic import can be replaced by a simpler, static
//   // import ViteWorker from './store/store.web-worker.ts?worker'
//   // once the double Webpack+Vite compatibility has been removed
//   // @ts-expect-error
//   const module = await import('./Data/WebWorker.ts?worker')
//   const ViteWorker = module.default()
//   console.log(ViteWorker)
//   // @ts-expect-error
//   // return Comlink.wrap<uui.domain.api.Store>(ViteWorker())
// }
// void createViteWorker()
// const worker = new Worker(MyWorker, { type: 'module' })
render(
  <App />
  , document.getElementById('app')!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
)
