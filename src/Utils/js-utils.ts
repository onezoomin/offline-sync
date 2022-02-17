export function formatAddressShort (addr: string = '???'): string {
  return `${addr.slice(0, 3).toUpperCase()}...${addr.slice(-3).toUpperCase()}`
}
const appStartTimeStamp = Date.now()
const p = performance.now()
let precision = 0
// milliseconds since epoch (100nanosecond "precision")
export function utcTs (): number {
  const now = new Date()
  const newPrecision = Math.round(performance.now() - p)
  precision = newPrecision === precision ? newPrecision + 1 : newPrecision // ensure 1ms difference - basically
  return appStartTimeStamp + precision + (now.getTimezoneOffset() * 60 * 1000)
}

export function styledConsoleLog (...args) {
  // https://stackoverflow.com/questions/7505623/colors-in-javascript-console#comment23574763_13017382
  const argArray: string[] = []

  if (args.length) {
    const startTagRe = /<span\s+style=(['"])([^'"]*)\1\s*>/gi
    const endTagRe = /<\/span>/gi

    let reResultArray
    argArray.push(args[0].replace(startTagRe, '%c').replace(endTagRe, '%c'))

    while (reResultArray = startTagRe.exec(args[0])) { // eslint-disable-line no-cond-assign
      argArray.push(reResultArray[2])
      argArray.push('')
    }

    // pass through subsequent args since chrome dev tools does not (yet) support console.log styling of the following form: console.log('%cBlue!', 'color: blue;', '%cRed!', 'color: red;');
    for (let j = 1; j < args.length; j++) {
      argArray.push(args[j])
    }
  }

  console.log.apply(console, argArray)
}
