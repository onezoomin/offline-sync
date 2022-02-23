import { Operations } from './Mods'
import { checkWorker, utcMsTs } from './Utils'

export const hookState = {
  isSuspended: false,
}
const userAddress = '0xWW'
export const getUpdateHookForTable = (tableName, commitMod) => {
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

export const getCreatingHookForTable = (tableName, commitMod) => {
  const addFx = function addHook (forKey, obj /*, transaction */) {
    checkWorker('call add hook')
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

export const getDeletingHookForTable = (tableName, commitMod) => {
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
