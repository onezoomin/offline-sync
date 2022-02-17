import { dump } from 'js-yaml'
import { utcTs } from '../Utils/js-utils'
import { ModDB } from './bygonz'
import { ModType } from './Mod'

// TODO consider reasons DBcore is superior to the hooks API:
// https://dexie.org/docs/DBCore/DBCore
//   It allows the injector to perform asynchronic actions before forwarding a call.
//   It allows the injector to take actions both before and after the forwarded call.
//   It covers more use cases, such as when a transaction is created, allow custom index proxies etc.
const modDB = new ModDB()
const modTable = modDB.Mods

const yamlOptions = {
  noArrayIndent: true,
}
export const createYamlLog = async () => {
  const mapped = (await modDB.Mods.toArray()).map(({ modified, tableName, op, priKey, log }) => {
    return {
      [`${modified}__${tableName}__${op}`]: {
        [priKey.toString()]: log,
      },
    }
  })
  const yaml = dump(mapped, yamlOptions)
  console.log(yaml)
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
      op: ModType.UPDATE,
      priKey,
      log: {
        put,
        revert,
      },

    }
    console.log('ww log mod', modLogEntry)
    void modTable.add(modLogEntry)
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
      op: ModType.CREATE,
      priKey,
      log: {
        obj,
      },
    }
    console.log('ww log add', modLogEntry)
    void modTable.add(modLogEntry)
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
      op: ModType.DELETE,
      priKey,
      log: {
        obj,
      },
    }
    console.log('ww log del', modLogEntry)
    void modTable.add(modLogEntry)
  }
  return delFx
}
