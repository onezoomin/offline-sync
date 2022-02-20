import axios from 'axios'
import format from 'date-fns/format'
import fromUnixTime from 'date-fns/fromUnixTime'
import getMinutes from 'date-fns/getMinutes'
import set from 'date-fns/set'
import { dump } from 'js-yaml'
import { Operations } from '../Model/Mod'
import { TaskVM } from '../Model/Task'
import { utcTs } from '../Utils/js-utils'
import { EpochDB, modDB } from './bygonz'
// TODO consider reasons DBcore is superior to the hooks API:
// https://dexie.org/docs/DBCore/DBCore
//   It allows the injector to perform asynchronic actions before forwarding a call.
//   It allows the injector to take actions both before and after the forwarded call.
//   It covers more use cases, such as when a transaction is created, allow custom index proxies etc.

const modTable = modDB.Mods

const minuteEpochDB = new EpochDB(6000, 'Minute')
const minutesTable = minuteEpochDB.Epochs

const yamlOptions = {
  noArrayIndent: true,
}
export const createYamlLog = async () => {
  const nownow = utcTs()
  const nowDate = fromUnixTime(nownow / 1000)
  const nextMinute = set(nowDate, { minutes: getMinutes(nowDate) + 1, seconds: 0, milliseconds: 0 }).getTime()
  const thisMinute = set(nowDate, { minutes: getMinutes(nowDate), seconds: 0, milliseconds: 0 }).getTime()
  const mapped = (await modDB.Mods.where('modified').above(thisMinute).toArray()).map(({ modified, tableName, op, priKey, log }) => {
    return {
      [`${modified?.toFixed(0) ?? ''}__${tableName}__${op}`]: {
        [priKey.toString()]: log,
      },
    }
  })
  const yaml = dump({ [thisMinute.toFixed(0)]: mapped }, yamlOptions)

  const msUntilEpoch = nextMinute - nownow
  if (msUntilEpoch < 10000) console.log('finish Epoch', thisMinute)

  void minutesTable.put({ ts: thisMinute, data: yaml })
  console.log(format(thisMinute, 'H:mm:ss:SSS'), 'next epoch in', msUntilEpoch)
}

export const dgraphUpsert = async (task) => {
  let response
  task.key = JSON.stringify(TaskVM.getCompoundKey(task))
  console.log('task obj:\n', task)
  console.time('sendTask')
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
      console.log(response)
      throw new Error(response.data.errors[0].message)
    } else {
      console.log(response.data)
    }
  } catch (e) {
    console.warn(e)
  }
  console.timeEnd('sendTask')
}
export const n8nUpsert = async (task: any) => {
  let response
  task.key = JSON.stringify(TaskVM.getCompoundKey(task))
  console.log('task obj to n8n:\n', task)
  console.time('sendTask')
  const data = { task }
  try {
    response = await axios({
      method: 'post',
      url: ' https://wh.n8n.zt.ax/webhook/dexie-dgraph',
      data,
      headers: { 'Content-Type': 'application/json' },
    })
    if (response.data.errors) {
      console.log(response)
      throw new Error(response.data.errors[0].message)
    } else {
      console.log(response.data)
    }
  } catch (e) {
    console.warn(e)
  }
  console.timeEnd('sendTask')
}
export const getUpdateHookForTable = (tableName) => {
  const upFx = function updHook (modifications, priKey, obj, transaction) {
  // You may use transaction to do additional database operations.
  // You may not do any modifications on any of the given arguments.
  // You may set this.onsuccess = function (updatedObj){} when update operation completes.
  // You may set this.onerror = callback if update operation fails.
  // If you want to make additional modifications,
  // return another modifications object
  // containing the additional or overridden modifications to make. Any returned
  // object will be merged to the given modifications object.

    console.log(transaction)
    const { modified: modFromChange, ...put } = modifications
    const revert = {}
    for (const eachKey in put) {
      revert[eachKey] = obj[eachKey]
    }
    const modified = Math.max(modFromChange || 0, utcTs())
    const modLogEntry = {
      modified,
      tableName,
      op: Operations.UPDATE,
      priKey,
      log: {
        put,
        revert,
      },

    }
    console.log('ww log mod', modLogEntry)
    void modTable.add(modLogEntry)
    void n8nUpsert({ ...obj, ...modifications })
    void createYamlLog()
  }
  return upFx
}

export const getCreatingHookForTable = (tableName) => {
  const addFx = function addHook (priKey, obj, transaction) {
    console.log(transaction)
    const modified = Math.max(obj.modified || 0, utcTs()) // actuall NaN is mathematically greater than all numbers (thanks javascript)
    const modLogEntry = {
      modified,
      tableName,
      op: Operations.CREATE,
      priKey,
      log: {
        obj,
      },
    }
    console.log('ww log add', modLogEntry)
    void modTable.add(modLogEntry)
    void createYamlLog()
    void n8nUpsert(obj)
    // void dgraphUpsert(obj)
  }
  return addFx
}

export const getDeletingHookForTable = (tableName) => {
  const delFx = function delHook (priKey, obj, transaction) {
    console.log(transaction)
    const modified = utcTs()
    const modLogEntry = {
      modified,
      tableName,
      op: Operations.DELETE,
      priKey,
      log: {
        obj,
      },
    }
    console.log('ww log del', modLogEntry)
    void modTable.add(modLogEntry)
    void createYamlLog()
  }
  return delFx
}
