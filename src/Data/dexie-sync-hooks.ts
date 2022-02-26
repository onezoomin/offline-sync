import axios from 'axios'
// import format from 'date-fns/format'
import fromUnixTime from 'date-fns/fromUnixTime'
import getMinutes from 'date-fns/getMinutes'
import set from 'date-fns/set'
import { dump } from 'js-yaml'
import { Operations } from '../Model/Mod'
import { TaskVM } from '../Model/Task'
import { ModVM } from './../Model/Mod'
import { EpochDB, modDB, utcMsTs } from './bygonz'
import { applyMods, hookState } from './Bygonz/mod-utils'
import { fetchMods } from './Bygonz/WebWorkerImports/dgraph-socket'
import { checkWorker, userAddress } from './WebWorker'

// TODO consider reasons DBcore is superior to the hooks API:
// https://dexie.org/docs/DBCore/DBCore
//   It allows the injector to perform asynchronic actions before forwarding a call.
//   It allows the injector to take actions both before and after the forwarded call.
//   It covers more use cases, such as when a transaction is created, allow custom index proxies etc.

const minuteEpochDB = new EpochDB(6000, 'Minute')
const minutesTable = minuteEpochDB.Epochs
const modTable = modDB.Mods
const commitMod = (modLogEntry) => {
  if (hookState.isSuspended) return // console.log('skipping commit')

  void modTable.add(modLogEntry)
  void dgraphMod(modLogEntry)
}

const yamlOptions = {
  noArrayIndent: true,
}
const since = {
  ts: 0,
}
const opLogRollup = async (force = false, forceSinceZero = false) => {
  const nownow = utcMsTs()
  const nowDate = fromUnixTime(nownow / 1000)
  const prevMinute = set(nowDate, { minutes: getMinutes(nowDate) - 1, seconds: 0, milliseconds: 0 }).getTime()
  const nextMinute = set(nowDate, { minutes: getMinutes(nowDate) + 1, seconds: 0, milliseconds: 0 }).getTime()
  const thisMinute = set(nowDate, { minutes: getMinutes(nowDate), seconds: 0, milliseconds: 0 }).getTime()

  let knownMods: ModVM[] = []
  let fetchedMods: ModVM[] = []
  const msUntilEpoch = nextMinute - nownow
  // console.log(format(thisMinute, 'H:mm:ss:SSS'), 'next epoch in', msUntilEpoch)

  const fetchAndApplyMods = async () => {
    const { todoDB } = await import('./dexie')
    checkWorker('fetchAndApplyMods', todoDB)
    knownMods = await modDB.Mods.where('ts').above(forceSinceZero ? 0 : since.ts).toArray() as ModVM[]
    fetchedMods = await fetchMods(forceSinceZero ? 0 : since.ts) // returns cast ModVM

    // console.log(fetchedMods?.length, 'mods fetched since :', format(since.ts, 'H:mm:ss:SSS'))
    since.ts = prevMinute
    // console.log('this:', format(thisMinute, 'H:mm:ss:SSS'), 'prev:', format(since.ts, 'H:mm:ss:SSS'))

    // do bulkPut - idempotent opLog merge
    if (fetchedMods?.length) {
      const modKeysKnown = knownMods.map((eachMod) => JSON.stringify(ModVM.getCompoundKey(eachMod)))

      const unknownMods = fetchedMods.filter((eachIncomingMod) => !modKeysKnown.includes(JSON.stringify(eachIncomingMod.id)))
      if (unknownMods.length) {
        console.log('modKeysKnown', modKeysKnown.length)
        console.log('unknown', unknownMods)
        await modDB.Mods.bulkPut(unknownMods)
        await applyMods(unknownMods, todoDB)
      } else {
        // console.log('all mods already known', modKeysKnown.length)
      }
    }
  }

  await fetchAndApplyMods()
  knownMods = await modDB.Mods.where('ts').above(thisMinute).toArray() as ModVM[]
  const mapped = knownMods.map(({ ts, tableName, op, forKey, log }) => {
    return {
      [`${ts?.toFixed(0) ?? ''}__${tableName}__${op}`]: {
        [forKey.toString()]: log,
      },
    }
  })

  const yaml = dump({ [thisMinute.toFixed(0)]: mapped }, yamlOptions)
  void minutesTable.put({ ts: thisMinute, data: yaml }) // commit running yaml log for thisMinute

  // if a new minute just started, get all mods since the previous minute
  if (force || msUntilEpoch >= 49999) { // TODO unhardcode the epoch and poll freq - this test is epochLength - pollFreq
    console.group('just finished Epoch', prevMinute)
    console.log((await minutesTable.get(prevMinute))?.data)
    console.groupEnd()
  }
}

const dgraphUpsert = async (task) => {
  checkWorker('dgraphUpsert async called from hook')
  const hookStateRef = hookState
  if (hookStateRef.isSuspended) return // console.log('skipping dgraphUpsert')
  let response
  task.key = JSON.stringify(TaskVM.getCompoundKey(task))
  // console.log('task obj:\n', task)
  console.time('sendTask dgraph')
  const data = {
    query: `mutation ($task: [AddTaskInput!]!) {
      addTask(input: $task, upsert: true) {
        task {
          key
          created
          owner
          modified
          task
          status
        }
      }
    }`,
    variables: {
      task,
    },
  }
  try {
    response = await axios({
      method: 'post',
      url: 'https://dghttp.zt.ax/graphql',
      data,
      headers: { 'Content-Type': 'application/json' },
    })
    if (response.data.errors) {
      // console.log(response)
      console.error(response.data)
    } else {
      // console.log(response.data)
    }
  } catch (e) {
    console.error(e)
  }
  console.timeEnd('sendTask dgraph')
}

const n8nUpsert = async (task: any) => {
  const hookStateRef = hookState
  if (hookStateRef.isSuspended) return // console.log('skipping n8nUpsert')
  let response
  task.key = JSON.stringify(TaskVM.getCompoundKey(task))
  // console.log('task obj to n8n:\n', task)
  console.time('addTask n8n')
  const data = { task }
  try {
    response = await axios({
      method: 'post',
      url: ' https://wh.n8n.zt.ax/webhook/dexie-dgraph',
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
  console.timeEnd('addTask n8n')
}
const getUpdateHookForTable = (tableName) => {
  checkWorker('create update hook')
  const upFx = function updHook (modifications, forKey, obj/* , transaction */) {
    checkWorker('call update hook')
    const hookStateRef = hookState
    if (hookStateRef.isSuspended) return // console.log('skipping updHook')
    // You may use transaction to do additional database operations.
    // You may not do any modifications on any of the given arguments.
    // You may set this.onsuccess = function (updatedObj){} when update operation completes.
    // You may set this.onerror = callback if update operation fails.
    // If you want to make additional modifications,
    // return another modifications object
    // containing the additional or overridden modifications to make. Any returned
    // object will be merged to the given modifications object.

    // console.log(transaction)
    const { modified: modFromChange, ...put } = modifications
    const revert = {}
    for (const eachKey in put) {
      revert[eachKey] = obj[eachKey]
    }

    const modified = Math.max(modFromChange || 0, utcMsTs())
    const updatedObj = { ...obj, ...modifications }

    const modLogEntry = {
      ts: modified,
      tableName,
      forKey,
      owner: obj.owner,
      modifier: userAddress,
      op: Operations.UPDATE,
      log: {
        put,
        obj: updatedObj,
        revert,
      },
    }
    // console.log('ww log mod', modLogEntry)
    commitMod(modLogEntry)

    // TODO check to avoid infinite loop
    // void n8nUpsert({ ...obj, ...modifications })
    // void dgraphUpsert(updatedObj)
  }
  return upFx
}

const getCreatingHookForTable = (tableName) => {
  const addFx = function addHook (forKey, obj /*, transaction */) {
    const hookStateRef = hookState
    if (hookStateRef.isSuspended) return // console.log('skipping addHook')
    // console.log(transaction)
    const modified = Math.max(obj.modified || 0, utcMsTs()) // actuall NaN is mathematically greater than all numbers (thanks javascript)
    const modLogEntry = {
      ts: modified,
      tableName,
      forKey,
      owner: obj.owner,
      modifier: obj.owner,
      op: Operations.CREATE,
      log: {
        obj,
      },
    }
    commitMod(modLogEntry)

    // void n8nUpsert(obj)
    // void dgraphUpsert(obj)
  }
  return addFx
}

const getDeletingHookForTable = (tableName) => {
  const delFx = function delHook (forKey, obj/* , transaction */) {
    if (hookState.isSuspended) return // console.log('skipping delHook')
    // console.log(transaction)
    const ts = utcMsTs()
    const modLogEntry = {
      ts,
      tableName,
      forKey,
      owner: obj.owner,
      modifier: userAddress,
      op: Operations.DELETE,
      log: {
        obj,
      },
    }
    commitMod(modLogEntry)
  }
  return delFx
}
