import axios from 'axios'
import format from 'date-fns/format'
import fromUnixTime from 'date-fns/fromUnixTime'
import getMinutes from 'date-fns/getMinutes'
import set from 'date-fns/set'
import { dump } from 'js-yaml'
import { Operations } from '../Model/Mod'
import { TaskVM } from '../Model/Task'
import { ModVM } from './../Model/Mod'
import { userAddress } from './../Model/Task'
import { EpochDB, modDB, utcMsTs } from './bygonz'
import { fetchMods } from './dgraph-socket'
import { todoDB } from './WebWorker'
// TODO consider reasons DBcore is superior to the hooks API:
// https://dexie.org/docs/DBCore/DBCore
//   It allows the injector to perform asynchronic actions before forwarding a call.
//   It allows the injector to take actions both before and after the forwarded call.
//   It covers more use cases, such as when a transaction is created, allow custom index proxies etc.

const modTable = modDB.Mods

const minuteEpochDB = new EpochDB(6000, 'Minute')
const minutesTable = minuteEpochDB.Epochs

const hookState = {
  suspend: false,
}

const commitMod = (modLogEntry) => {
  if (hookState.suspend) return console.log('skipping commit')

  void modTable.add(modLogEntry)
  void dgraphMod(modLogEntry)
}

const applyMods = (castModsVMarray) => {
  // console.log('apply', castModsVMarray)

  const addMods: Record<string, ModVM[]> = {}
  const putMods: Record<string, ModVM[]> = {}
  const delMods: Record<string, ModVM[]> = {}

  for (const eachMod of castModsVMarray) {
    if (eachMod.op === Operations.UPDATE) {
      if (!putMods[eachMod.tableName]) putMods[eachMod.tableName] = []
      putMods[eachMod.tableName].push(eachMod.log.obj)
    } else if (eachMod.op === Operations.CREATE) {
      if (!addMods[eachMod.tableName]) addMods[eachMod.tableName] = []
      addMods[eachMod.tableName].push(eachMod.log.obj)
    } else if (eachMod.op === Operations.DELETE) {
      if (!delMods[eachMod.tableName]) delMods[eachMod.tableName] = []
      delMods[eachMod.tableName].push(eachMod.log.obj)
    } else {
      console.log('huh', eachMod)
    }
  }
  console.log('apply', castModsVMarray, { add: addMods }, { put: putMods }, { del: delMods })
  hookState.suspend = true
  for (const eachTabName in addMods) {
    console.log('adding via Mods', eachTabName, addMods[eachTabName])
    todoDB[eachTabName]?.bulkPut(addMods[eachTabName])
  }
  for (const eachTabName in putMods) {
    console.log('putting via Mods', eachTabName, putMods[eachTabName])
    todoDB[eachTabName]?.bulkPut(putMods[eachTabName])
  }
  for (const eachTabName in delMods) {
    console.log('deleting via Mods', eachTabName, delMods[eachTabName])
    todoDB[eachTabName]?.bulkDelete(delMods[eachTabName])
  }
  hookState.suspend = false
}
const yamlOptions = {
  noArrayIndent: true,
}
const since = {
  ts: 0,
}
export const opLogRollup = async (force = false, forceSinceZero = false) => {
  const nownow = utcMsTs()
  const nowDate = fromUnixTime(nownow / 1000)
  const prevMinute = set(nowDate, { minutes: getMinutes(nowDate) - 1, seconds: 0, milliseconds: 0 }).getTime()
  const nextMinute = set(nowDate, { minutes: getMinutes(nowDate) + 1, seconds: 0, milliseconds: 0 }).getTime()
  const thisMinute = set(nowDate, { minutes: getMinutes(nowDate), seconds: 0, milliseconds: 0 }).getTime()

  let knownMods = await modDB.Mods.where('ts').above(forceSinceZero ? 0 : since.ts).toArray()

  const msUntilEpoch = nextMinute - nownow
  // if a new minute just started, get all mods since the previous minute
  if (force || msUntilEpoch > 50000) {
    console.log('just finished Epoch', prevMinute, 'fetching all Mods')
    const mods = await fetchMods(forceSinceZero ? 0 : since.ts) // returns cast ModVM
    since.ts = thisMinute

    console.log(mods?.length, 'mods fetched since :', format(since.ts, 'H:mm:ss:SSS'))
    // do bulkPut - idempotent opLog merge
    if (mods?.length) {
      const modKeysKnown = knownMods.map((eachMod) => JSON.stringify(ModVM.getCompoundKey(eachMod)))
      console.log('modKeysKnown', modKeysKnown)

      const unknownMods = mods.filter((eachIncomingMod) => !modKeysKnown.includes(JSON.stringify(eachIncomingMod.id)))

      console.log('unknown', unknownMods)

      await modDB.Mods.bulkPut(unknownMods)
      knownMods = await modDB.Mods.toArray()
      applyMods(knownMods)
    }
  }
  knownMods = await modDB.Mods.where('ts').above(thisMinute).toArray()
  const mapped = knownMods.map(({ ts, tableName, op, forKey, log }) => {
    return {
      [`${ts?.toFixed(0) ?? ''}__${tableName}__${op}`]: {
        [forKey.toString()]: log,
      },
    }
  })
  // commit running yaml log for thisMinute after

  const yaml = dump({ [thisMinute.toFixed(0)]: mapped }, yamlOptions)
  void minutesTable.put({ ts: thisMinute, data: yaml })

  console.log(format(thisMinute, 'H:mm:ss:SSS'), 'next epoch in', msUntilEpoch)
}

export const dgraphUpsert = async (task) => {
  const hookStateRef = hookState
  if (hookStateRef.suspend) return console.log('skipping dgraphUpsert')
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

export const dgraphMod = async (modIsh: any, modJson = (new ModVM(modIsh)).forGql()) => {
  const hookStateRef = hookState
  if (hookStateRef.suspend) return console.log('skipping commitMod')

  let response
  console.time('sendMod dgraph')
  // console.log('mod json obj:\n', modIsh)

  const data = {
    query: `mutation ($mod: [AddModInput!]!) {
      addMod(input: $mod) {
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
export const n8nUpsert = async (task: any) => {
  const hookStateRef = hookState
  if (hookStateRef.suspend) return console.log('skipping n8nUpsert')
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
export const getUpdateHookForTable = (tableName) => {
  const upFx = function updHook (modifications, forKey, obj/* , transaction */) {
    const hookStateRef = hookState
    if (hookStateRef.suspend) return console.log('skipping updHook')
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
    void dgraphUpsert(updatedObj)
  }
  return upFx
}

export const getCreatingHookForTable = (tableName) => {
  const addFx = function addHook (forKey, obj /*, transaction */) {
    const hookStateRef = hookState
    if (hookStateRef.suspend) return console.log('skipping addHook')
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
    void dgraphUpsert(obj)
  }
  return addFx
}

export const getDeletingHookForTable = (tableName) => {
  const delFx = function delHook (forKey, obj/* , transaction */) {
    if (hookState.suspend) return console.log('skipping delHook')
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
