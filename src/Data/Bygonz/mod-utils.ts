const all = Promise.all.bind(Promise) // https://stackoverflow.com/a/48399813/2919380

export const checkWorker = (...msg) => {
  // run this in global scope of window or worker. since window.self = window, we're ok
  if (self.document === undefined) {
    console.log('Worker!', ...msg)
  } else {
    console.log(self.document, ' sad trombone. not worker ', ...msg)
  }
}
checkWorker('top of mod utils')

export const hookState = {
  isSuspended: false,
}
