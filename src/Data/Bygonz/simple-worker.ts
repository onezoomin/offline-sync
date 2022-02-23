
export const checkWorker = (...msg) => {
  if (self.document === undefined) {
    console.log('Worker!', ...msg)
  } else {
    console.log(self.document, ' sad trombone. not worker ', ...msg)
  }
}
checkWorker('top of simple worker')
self.onmessage = (e) => {
  checkWorker('on message in worker', e)
  if (e.data === 'ping') {
    self.postMessage({ msg: `${e} - ${counter++}`, mode: 'foo' })
  } else if (e.data === 'clear') {
    counter = 1
    self.postMessage({ msg: null, mode: null })
  }
}
