
let counter = 0
self.onmessage = (e) => {
  const checkWorker = (...msg) => {
    // run this in global scope of window or worker. since window.self = window, we're ok
    if (self.document === undefined && !(self instanceof Window)) {
      console.log('huzzah! a worker!', ...msg)
    } else {
      console.log(self?.DedicatedWorkerGlobalScope, self?.WorkerGlobalScope, self.document, ' sad trombone. not worker ', ...msg)
    }
  }
  checkWorker('top of worker', e)
  if (e.data === 'ping') {
    self.postMessage({ msg: `${e} - ${counter++}`, mode: 'foo' })
  } else if (e.data === 'clear') {
    counter = 1
    self.postMessage({ msg: null, mode: null })
  }
}
