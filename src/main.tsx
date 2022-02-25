
import { h, render } from 'preact'
import 'virtual:windi.css'
import { App } from './app'
import './index.css'

// import { userAddress } from './Data/wallet'
// import SimpleWorker from './Data/simple-worker?worker'
// import BygonzWorker from './Data/WebWorker?worker' // &inline
// const bygonzWorker = new BygonzWorker()
// bygonzWorker.postMessage({ cmd: 'init', userAddress }) // init

render(
  <App />
  , document.getElementById('app')!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
)
