export const checkWorker = (...msg) => {
  if (self.document === undefined) {
    console.log('Worker!', ...msg)
  } else {
    console.log(self.document, ' sad trombone. not worker ', ...msg)
  }
}

const appStartTimeStamp = Date.now()
const p = performance.now()
let precision = 0
// milliseconds since epoch (100nanosecond "precision")
export function utcMsTs (): number {
  const now = new Date()
  const newPrecision = Math.round(performance.now() - p)
  precision = newPrecision === precision ? newPrecision + 1 : newPrecision // ensure 1ms difference - basically
  return appStartTimeStamp + precision + (now.getTimezoneOffset() * 60 * 1000)
}

export const BYGONZ_MUTATION_EVENT_NAME = 'bygonzmutation'
