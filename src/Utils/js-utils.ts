export function formatAddressShort (addr: string = '???'): string {
  return `${addr.slice(0, 3).toUpperCase()}...${addr.slice(-3).toUpperCase()}`
}
export function styledConsoleLog (...args) {
  const argArray = []

  if (args.length) {
    const startTagRe = /<span\s+style=(['"])([^'"]*)\1\s*>/gi
    const endTagRe = /<\/span>/gi

    let reResultArray
    argArray.push(args[0].replace(startTagRe, '%c').replace(endTagRe, '%c'))
    while (reResultArray = startTagRe.exec(args[0])) {
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
