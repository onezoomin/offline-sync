import { h, render } from 'preact'
import 'virtual:windi.css'
import { App } from './app'
import './index.css'

render(
  <App />
  , document.getElementById('app')!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
)
