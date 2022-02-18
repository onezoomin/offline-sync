import Hypercore from 'hypercore'
import ram from 'random-access-memory'
export const core = new Hypercore((filename) => {
  // filename will be one of: data, bitfield, tree, signatures, key, secret_key
  // the data file will contain all your data concatenated.
  console.log(filename)

  // just store all files in ram by returning a random-access-memory instance
  return ram()
})

export const initHyper = async () => {
  const seq = await core.append({ koo: 'jar' })
  console.log(seq)
}
