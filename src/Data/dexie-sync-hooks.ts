import { ModDB } from './bygonz'

// TODO consider reasons DBcore is superior to the hooks API:
// https://dexie.org/docs/DBCore/DBCore
//   It allows the injector to perform asynchronic actions before forwarding a call.
//   It allows the injector to take actions both before and after the forwarded call.
//   It covers more use cases, such as when a transaction is created, allow custom index proxies etc.
const modDB = new ModDB()
const modTable = modDB.Mods
export function updHook (modifications, priKey, obj, transaction) {
  // You may use transaction to do additional database operations.
  // You may not do any modifications on any of the given arguments.
  // You may set this.onsuccess = function (updatedObj){} when update operation completes.
  // You may set this.onerror = callback if update operation fails.
  // If you want to make additional modifications,
  // return another modifications object
  // containing the additional or overridden modifications to make. Any returned
  // object will be merged to the given modifications object.
  const { modified, ...changes } = modifications
  const prev = {}
  for (const eachKey in changes) {
    prev[eachKey] = obj[eachKey]
  }
  const modLogEntry = {
    modified,
    priKey,
    log: {
      changes,
      prev,
    },

  }
  console.log('ww log mod', modLogEntry)
  void modTable.add(modLogEntry)
}

export function addHook (priKey, obj, transaction) {
  const modLogEntry = {
    modified: obj.modified,
    priKey,
    log: {
      obj,
    },
  }
  console.log('ww log add', modLogEntry)
  void modTable.add(modLogEntry)
}
