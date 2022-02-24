import { DBCore, DBCoreAddRequest, DBCoreDeleteRangeRequest, DBCoreDeleteRequest, DBCorePutRequest, Middleware } from 'dexie'
import { Operations } from './WebWorkerImports/Mods'
import { BYGONZ_MUTATION_EVENT_NAME, utcMsTs } from './WebWorkerImports/Utils'
const getAfterEffectsFor = (instantiatedDBRef, tableName) => {
  console.log('getAfterEffectsFor', instantiatedDBRef)
  const bc = new BroadcastChannel(BYGONZ_MUTATION_EVENT_NAME)
  return {
    add (reqCopy: DBCoreAddRequest | DBCorePutRequest) {
      const obj = reqCopy.values[0]
      const forKey = [obj.created, obj.owner] // TODO needs to come from or be inferred from trans
      const modified = obj.modified
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
      console.log('dbcore add', utcMsTs())
      bc.postMessage(modLogEntry)
    },
    put  (reqCopy: DBCorePutRequest) {
      const obj = reqCopy.values[0]
      const forKey = [obj.created, obj.owner]

      const modifications = reqCopy.changeSpec

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
        modifier: obj.owner, // TODO userAddress, https://github.com/dexie/Dexie.js/blob/e865e80a3c05821db40ecc3c64157104d345b11e/addons/dexie-cloud/src/middlewares/createMutationTrackingMiddleware.ts#L81
        op: Operations.UPDATE,
        log: {
          put,
          obj: updatedObj,
          revert,
        },
      }
      console.log('dbcore put', modLogEntry)
    },
    async delete (reqCopy: DBCoreDeleteRequest, obj) {
      const ts = utcMsTs()
      const forKey = reqCopy.keys[0]

      const modLogEntry = {
        ts,
        tableName,
        forKey,
        owner: obj.owner,
        modifier: obj.owner, // TODO userAddress,
        op: Operations.DELETE,
        log: {
          obj,
        },
      }
      console.log('dbcore delete', modLogEntry)
    },
    deleteRange (reqCopy: DBCoreDeleteRangeRequest) {
      console.log('dbcore deleteRange', reqCopy)
    },
  }
}

export const getBygonzMiddlwareFor = (instantiatedDBRef): Middleware<DBCore> => ({
  stack: 'dbcore', // The only stack supported so far.
  name: 'bygonz', // Optional name of your middleware
  create (downlevelDatabase) {
    let afterEffects
    // Return your own implementation of DBCore:
    return {
    // Copy default implementation.
      ...downlevelDatabase,
      // Override transaction method
      // transaction (tables, mode, ...args) {
      //   // Call default transaction method
      //   const downlevelTrans: DBCoreTransaction & {callAfter?: Function } = downlevelDatabase.transaction(tables, mode, ...args)

      //   const myTrans = { ...downlevelTrans }
      //   console.log(downlevelTrans.callAfter, myTrans.callAfter, 'dbcore downlevelTrans', downlevelTrans)
      //   if (mode === 'readwrite') {
      // setTimeout(() => {
      //   if (downlevelTrans.callAfter !== undefined) {
      //     // downlevelTrans.callAfter.call(null, downlevelTrans)
      //     downlevelTrans.addEventListener('complete', downlevelTrans.callAfter)
      //   }
      //   // console.log(downlevelTrans.callAfter, 'dbcore downlevelTrans', downlevelTrans)
      // }, 5)
      //   }
      //   // Derive your own transaction from it:
      //   return downlevelTrans
      // },

      // Override table method
      table (tableName) {
      // Call default table method
        const downlevelTable = downlevelDatabase.table(tableName)
        // Derive your own table from it:

        afterEffects = getAfterEffectsFor(instantiatedDBRef, tableName)

        const mutate = async req => {
          // Copy the request object
          const myRequest = { ...req }
          const { type } = myRequest

          // console.log('dbcore mut', myRequest)
          let afterEffectCallback = (completeEvent: Event) => {
            console.log('ae callback', type, completeEvent)
            afterEffects[type](myRequest)
          }
          if (type === 'put') {
            const isActuallyPut = !!(myRequest.changeSpec) // TODO check reliability
            if (!isActuallyPut) {
              console.log('dbcore put used as add not update, calling add instead')
              afterEffectCallback = (completeEvent: Event) => {
                console.log('ae callback', completeEvent)
                afterEffects.add(myRequest)
              }
            }
          }
          if (type === 'delete') {
            const obj = await instantiatedDBRef[tableName].get(myRequest.keys[0])
            console.log('dbcore pre delete', instantiatedDBRef, obj)
            afterEffectCallback = (completeEvent: Event) => {
              console.log('ae callback', completeEvent)
              afterEffects.delete(myRequest, obj)
            }
          }

          // myRequest.trans.callAfter = afterEffectCallback
          // afterEffectCallback(myRequest.trans)
          // call downlevel mutate:
          return await downlevelTable.mutate(myRequest).then(res => {
            // Do things after mutate
            if (myRequest.trans.mode === 'readwrite') {
              // we are not quite through yet, tx could still fail or revert, so adding onComplete listener
              myRequest.trans.addEventListener('complete', afterEffectCallback)
            }
            const myResponse = { ...res }
            // console.log('dbcore mut then', myResponse)

            // Then return your response:
            return myResponse
          })
        }
        return {
        // Copy default table implementation:
          ...downlevelTable,
          // adding extensible afterEffects
          afterEffects,
          // Override the mutate method:
          mutate,
        }
      },
    }
  },
})
