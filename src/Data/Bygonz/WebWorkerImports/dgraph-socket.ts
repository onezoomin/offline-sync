import { ApolloClient, DefaultOptions, gql, HttpLink, InMemoryCache } from '@apollo/client/core'
import axios from 'axios'
import format from 'date-fns/format'
import fromUnixTime from 'date-fns/fromUnixTime'
import getMinutes from 'date-fns/getMinutes'
import set from 'date-fns/set'
import { PromiseExtended, Table } from 'dexie'
import { defer } from 'lodash'
import { TaskVM } from '../../../Model/Task'
import { CompoundKeyNumStr, ModVM, Operations } from './Mods'
import { checkWorker, utcMsTs } from './Utils'

const all = Promise.all.bind(Promise) // https://stackoverflow.com/a/48399813/2919380

// const clientWS = createClient({
//   url: 'wss://dghttp.zt.ax/graphql',
// })
// const wsLink = new WebSocketLink({
//   uri: 'https://dghttp.zt.ax/graphql', // Can test with your Slash GraphQL endpoint (if you're using Slash GraphQL)
//   options: {
//     reconnect: true,
//     // connectionParams: {
//     //   authToken: user.authToken,
//     // },
//   },
// })

const httpLink = new HttpLink({
  uri: 'https://dghttp.zt.ax/graphql',
})

// const splitLink = split(
//   ({ query }) => {
//     const definition = getMainDefinition(query)
//     return (
//       definition.kind === 'OperationDefinition'
//       && definition.operation === 'subscription'
//     )
//   },
//   wsLink,
//   httpLink,
// )
const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
}
const client = new ApolloClient({
  cache: new InMemoryCache({
    resultCaching: false,
  }),
  link: httpLink,
  defaultOptions,
})

// query
// (async () => {
//   const result = await new Promise((resolve, reject) => {
//     let result
//     client.subscribe(
//       {
//         query: '{ hello }',
//       },
//       {
//         next: (data) => (result = data),
//         error: reject,
//         complete: () => resolve(result),
//       },
//     )
//   })

//   expect(result).toEqual({ hello: 'Hello World!' })
// })();

const subQuery = `
subscription {
  queryTask {
    modified
    created
    task
    status
    owner
  }
}`

// https://github.com/enisdenjo/graphql-ws#observable
// function toObservable (operation) {
//   return new Observable((observer) =>
//     clientWS.subscribe(operation, {
//       next: (data) => observer.next(data),
//       error: (err) => observer.error(err),
//       complete: () => observer.complete(),
//     }),
//   )
// }

// export const initSub = () => {
//   const observable = toObservable({ query: subQuery })

//   const subscription = observable.subscribe({
//     next: (data) => {
//     // expect(data).toBe({ data: { ping: 'pong' } })
//       console.log('wsdata:', data)
//     },
//   })
//   return subscription

// // subscription.unsubscribe()
// }

const opts = {
  since: 0,
  searchFilter: '',
}
export const initPoll = (onResults, sinceOpt = 0, searchFilter = '', freq = 60000) => {
  opts.since = sinceOpt
  opts.searchFilter = searchFilter

  setInterval(() => {
    if (searchFilter) {
      searchFilter = `,
      and: {
        task: {
          anyoftext: "${searchFilter}"
        }
      }`
    }
    const taskQuery = `
  query {
    queryTask(filter: {
      modified: {
        gt: ${opts.since}
      }${opts.searchFilter}
    }) {
      modified
      created
      task
      status
      owner
    }
  }`
    // console.log('q', taskQuery)
    opts.since = utcMsTs() // so that next request gets all after now now
    client.query({
      query: gql(taskQuery),
      // variables: {
      //   name,
      // },
    }).then((response) => {
      const tasks = response?.data?.queryTask
      if (tasks?.length) {
        // void todoDB.ActiveTasks.bulkPut(tasks)

        // const mostRecentMod = Math.max(...(tasks.map((o) => o.modified)), 0)
        // console.log(mostRecentMod, opts.since, 'in poll', response)
        onResults(response)
      } else {
        console.log('no tasks returned', response)
      }
    }).catch((e) => {
      console.error(e)
    })
  }, freq)
}

const castJsonModArray = (modishArray): ModVM[] => modishArray.map((eachMod) => {
  const cleanMod = { ...eachMod, log: JSON.parse(eachMod.log), forKey: JSON.parse(eachMod.forKey) }
  delete cleanMod.__typename
  return new ModVM(cleanMod)
})

export const fetchMods = async (since = 0): Promise<ModVM[]> => {
  // console.time('fetchMods took')
  const modQuery = `
  query {
    queryMod(order: { asc: ts },filter: {
      ts: {
        gt: ${since}
      }
    }) {
      ts
      tableName
      forKey
      owner
      modifier
      op
      log
    }
  }`
  let returnArray: ModVM[] = []
  try {
    const response = await client.query({
      query: gql(modQuery),
      // variables: {
      //   name,
      // },
    })
    const mods = response?.data?.queryMod ?? []
    // if (mods?.length) {
    //   // console.log('mod results', response)
    // } else {
    //   // console.log('no mods returned', response)
    // }
    returnArray = castJsonModArray(mods)
  } catch (e) {
    console.warn(e)
  }
  // console.timeEnd('fetchMods took')
  return returnArray
}

export const dgraphMod = async (modIsh: any, modJson = (new ModVM(modIsh)).forGql()) => {
  checkWorker('dgraphMod')

  // const hookStateRef = hookState
  // if (hookStateRef.isSuspended) return // console.log('skipping commitMod')

  let response
  console.time('sendMod dgraph')
  // console.log('mod json obj:\n', modIsh)

  const data = {
    query: `mutation ($mod: [AddModInput!]!) {
      addMod(input: $mod, upsert: true) {
        mod {
          key
          ts
          tableName 
          forKey
          owner 
          modifier 
          op
          log
        }
      }
    }`,
    variables: {
      mod: modJson,
    },
  }
  // console.log('add mod mutation :\n', data)
  try {
    response = await axios({
      method: 'post',
      url: 'https://dghttp.zt.ax/graphql',
      data,
      headers: { 'Content-Type': 'application/json' },
    })
    if (response.data.errors) {
      console.error(response.data)
    } else {
      // console.log(response.data)
    }
  } catch (e) {
    console.error(e)
  }
  console.timeEnd('sendMod dgraph')
}

export const applyMods = async (castModsVMarray, whichDB) => {
  // console.log('apply', castModsVMarray)
  checkWorker('applyMods')
  if (!whichDB || !castModsVMarray?.length) return console.warn('bailing out of applyMods', whichDB, castModsVMarray)

  const addMods: Record<string, ModVM[]> = {}
  const putMods: Record<string, ModVM[]> = {}
  const delMods: Record<string, CompoundKeyNumStr[]> = {}

  for (const eachMod of castModsVMarray) {
    if (eachMod.op === Operations.UPDATE) {
      if (!putMods[eachMod.tableName]) putMods[eachMod.tableName] = []
      putMods[eachMod.tableName].push(eachMod.log.obj)
    } else if (eachMod.op === Operations.CREATE) {
      if (!addMods[eachMod.tableName]) addMods[eachMod.tableName] = []
      addMods[eachMod.tableName].push(eachMod.log.obj)
    } else if (eachMod.op === Operations.DELETE) {
      if (!delMods[eachMod.tableName]) delMods[eachMod.tableName] = []
      delMods[eachMod.tableName].push(TaskVM.getCompoundKey(eachMod.log.obj)) // TODO create interface for log entries and objWithId
    } else {
      console.log('unknown op', eachMod)
    }
  }
  console.log('apply', castModsVMarray, { add: addMods }, { put: putMods }, { del: delMods })
  // hookState.isSuspended = true
  const bulkPromises: PromiseExtended[] = []
  try {
    for (const eachTabName in addMods) {
      console.log('creating via Mods', eachTabName, addMods[eachTabName])
      bulkPromises.push((whichDB[eachTabName] as Table)?.bulkPut(addMods[eachTabName]))
    }
    for (const eachTabName in putMods) {
      console.log('updating via Mods', eachTabName, putMods[eachTabName])
      bulkPromises.push((whichDB[eachTabName] as Table)?.bulkPut(putMods[eachTabName]))
    }
    for (const eachTabName in delMods) {
      console.log('deleting via Mods', eachTabName, delMods[eachTabName])
      bulkPromises.push((whichDB[eachTabName] as Table)?.bulkDelete(delMods[eachTabName]))
    }
    await all(bulkPromises)
    // hookState.isSuspended = false
  } catch (e) {
    console.error('applying mods', e)
    // hookState.isSuspended = false
  }
}

const since = {
  ts: 0,
}
const pendingFetches: number[] = []
export const fetchAndApplyMods = async (modDB, targetDB, forceSinceZero = false) => {
  const nownow = utcMsTs()
  if (pendingFetches.length > 0) return
  pendingFetches.push(nownow)
  const nowDate = fromUnixTime(nownow / 1000)
  const prevMinute = set(nowDate, { minutes: getMinutes(nowDate) - 1, seconds: 0, milliseconds: 0 }).getTime()
  const nextMinute = set(nowDate, { minutes: getMinutes(nowDate) + 1, seconds: 0, milliseconds: 0 }).getTime()
  const thisMinute = set(nowDate, { minutes: getMinutes(nowDate), seconds: 0, milliseconds: 0 }).getTime()

  let knownMods: ModVM[] = []
  let fetchedMods: ModVM[] = []

  knownMods = await modDB.Mods.where('ts').above(forceSinceZero ? 0 : since.ts).toArray() as ModVM[]
  fetchedMods = await fetchMods(forceSinceZero ? 0 : since.ts) // returns cast ModVM
  checkWorker('fetchAndApplyMods fetched,known:', fetchedMods.length, knownMods.length, format(thisMinute, 'H:mm:ss:SSS'))
  // console.log(fetchedMods?.length, 'mods fetched since :', format(since.ts, 'H:mm:ss:SSS'))
  since.ts = prevMinute
  // console.log('this:', format(thisMinute, 'H:mm:ss:SSS'), 'prev:', format(since.ts, 'H:mm:ss:SSS'))

  // do bulkPut - idempotent opLog merge
  if (fetchedMods?.length) {
    const modKeysKnown = knownMods.map((eachMod) => JSON.stringify(ModVM.getCompoundKey(eachMod)))
    const modKeysRemotelyKnown = fetchedMods.map((eachMod) => JSON.stringify(ModVM.getCompoundKey(eachMod)))

    const unknownMods = fetchedMods.filter((eachIncomingMod) => !modKeysKnown.includes(JSON.stringify(eachIncomingMod.id)))
    const modsUnknownRemotely = knownMods.filter((eachLocallyKnownMod) => !modKeysRemotelyKnown.includes(JSON.stringify(eachLocallyKnownMod.id)))

    if (unknownMods.length) {
      console.log('modKeysKnown', modKeysKnown.length)
      console.log('unknown', unknownMods)
      await modDB.Mods.bulkPut(unknownMods)
      await applyMods(unknownMods, targetDB)
    } else {
      // console.log('all mods already known', modKeysKnown.length)
    }
    if (modsUnknownRemotely.length) {
      console.log('unknown remotely', modsUnknownRemotely)
      for (const eachModToBeReported of modsUnknownRemotely) {
        void dgraphMod(eachModToBeReported) // TODO bulkPut
      }
    }
  }
  setTimeout(() => {
    void findAndFlagConflicts(modDB, targetDB)
  })
  console.log('fetchAndApply took', utcMsTs() - (pendingFetches.pop() ?? 0))
  setTimeout(() => { void fetchAndApplyMods(modDB, targetDB) }, nextMinute - nownow)
}
const exampleCustomHandler = (allModsForKey: ModVM[]) => {
  defer(() => {
    const customFlags = []
    // console.log('exampleCustomHandler', allModsForKey)
    for (const eachMod of allModsForKey) {

    }
  })
}

export const findAndFlagConflicts = async (modDB, targetDB, forceSinceZero = false) => {
  const st = utcMsTs()
  const { conflictThresholds: { red, yellow } } = targetDB.options // conflictHandlers: { customFlag = exampleCustomHandler },
  const allKnownMods = (await modDB.Mods.orderBy('forKey').toArray() ?? []) as ModVM[]

  const modsMappedbyForKey = new Map()
  interface flagObj { thisMod: ModVM, prevMod: ModVM, diffInSec: number }
  const redFlags: flagObj[] = []
  const yellowFlags: flagObj[] = []

  let prevKey = ''
  let prevMod
  for (const thisMod of allKnownMods) {
    const thisKey = thisMod.gqlForKey
    const thisModArray = modsMappedbyForKey.get(thisKey) ?? []
    if (prevKey) { // start testing on the second one
      if (thisKey !== prevKey) {
        // const prevModArray = modsMappedbyForKey.get(prevKey)
        // if (prevModArray.length > 1) exampleCustomHandler(prevModArray) // spin off a call to each custom conflictHandler as soon as the loop finishes
      } else if (thisMod.tableName === prevMod.tableName && thisMod.modifier !== prevMod.modifier) { // && thisMod.modifier !== prevMod.modifier
        const diffInSec = (thisMod.ts - prevMod.ts) * 0.001
        if (diffInSec < red) {
          console.log('found red flag', thisMod, prevMod)
          redFlags.push({ thisMod, prevMod, diffInSec })
        } else if (diffInSec < yellow) {
          console.log('found yellow flag', thisMod, prevMod)
          yellowFlags.push({ thisMod, prevMod, diffInSec })
        }
      }
    }
    // console.log(thisModArray)
    thisModArray.push(thisMod)
    modsMappedbyForKey.set(thisKey, thisModArray)
    prevKey = thisKey
    prevMod = thisMod
  }
  console.log('took', utcMsTs() - st, 'all mods mapped by key', modsMappedbyForKey, { yellowFlags, redFlags })
}
