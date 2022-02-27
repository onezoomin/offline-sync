import { DBCore, DBCoreAddRequest, DBCoreDeleteRangeRequest, DBCoreDeleteRequest, DBCorePutRequest, Middleware, Table } from 'dexie'
import { Operations } from './WebWorkerImports/Mods'
import { BYGONZ_MUTATION_EVENT_NAME, utcMsTs } from './WebWorkerImports/Utils'
const getAfterEffectsFor = (tableName) => {
  const bc = new BroadcastChannel(BYGONZ_MUTATION_EVENT_NAME)
  console.log('getAfterEffectsFor', tableName, bc)

  return {
    add (reqCopy: (DBCoreAddRequest | DBCorePutRequest) & { keys: any[]}) {
      // console.log('dbcore add', reqCopy)
      const { keys, values } = reqCopy
      values.forEach((eachObj, idx) => {
        const eachKey = keys[idx]
        const modified = eachObj.modified
        const modLogEntry = {
          ts: modified,
          tableName,
          forKey: eachKey,
          owner: eachObj.owner,
          modifier: eachObj.owner,
          op: Operations.CREATE,
          log: {
            obj: eachObj,
          },
        }
        bc.postMessage(modLogEntry)
      })
    },
    put  (reqCopy: DBCorePutRequest & { keys: any[]}, obj: any) {
      console.log('dbcore put', reqCopy)
      const forKey = reqCopy.keys[0]
      const put = reqCopy.changeSpec
      const revert = {}
      for (const eachKey in put) {
        revert[eachKey] = obj[eachKey]
      }

      const updatedObj = { ...obj, ...put }
      const modified = updatedObj.modified

      const modLogEntry = {
        ts: modified,
        tableName,
        forKey,
        owner: obj.owner,
        modifier: obj.modifier ?? obj.owner ?? '??', // TODO consider user awareness down here, https://github.com/dexie/Dexie.js/blob/e865e80a3c05821db40ecc3c64157104d345b11e/addons/dexie-cloud/src/middlewares/createMutationTrackingMiddleware.ts#L81
        op: Operations.UPDATE,
        log: {
          put,
          obj: updatedObj,
          revert,
        },
      }
      console.log('dbcore put', modLogEntry)
      bc.postMessage(modLogEntry)
    },
    async delete (reqCopy: DBCoreDeleteRequest & {tableRef: Table}, obj) {
      const ts = obj.modified ?? utcMsTs()
      const forKey = reqCopy.keys[0]
      console.log('dbcore ae delete', reqCopy, obj)
      const modLogEntry = {
        ts,
        tableName,
        forKey,
        owner: obj.owner,
        modifier: obj.modifier ?? obj.owner ?? '??',
        op: Operations.DELETE,
        log: {
          obj,
        },
      }
      console.log('dbcore delete', modLogEntry)
      bc.postMessage(modLogEntry)
    },
    deleteRange (reqCopy: DBCoreDeleteRangeRequest) {
      console.log('dbcore deleteRange - not broadcasting...yet', reqCopy)
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

      // Override table method
      table (tableName) {
      // Call default table method
        const downlevelTable = downlevelDatabase.table(tableName)

        const tableRef = instantiatedDBRef[tableName]
        afterEffects = getAfterEffectsFor(tableName)

        const mutate = async req => {
          // Copy the request object and tag on tableRef
          const myRequest = { ...req, tableRef }

          // get the type from the req
          const { type } = myRequest
          const { primaryKey } = downlevelTable.schema

          // console.log('dbcore mut', myRequest)
          let afterEffectCallback = (completeEvent: Event) => {
            // console.log('ae callback', type, completeEvent)
            afterEffects[type](myRequest)
          }
          if (type === 'add') {
            let forKey
            if (myRequest.keys?.length) {
              forKey = myRequest.keys[0]
            } else {
              forKey = primaryKey?.extractKey(myRequest.values[0])
              myRequest.keys = [forKey]
              console.log('dbcore pre add didnt find key, needed to extract', tableRef, myRequest)
            }
          }
          if (type === 'put') {
            console.log('dbcore pre put', tableRef, myRequest)
            let forKey
            if (myRequest.keys?.length) {
              forKey = myRequest.keys[0]
            } else {
              forKey = primaryKey?.extractKey(myRequest.values[0])
              myRequest.keys = [forKey]
              console.log('dbcore pre put didnt find key, needed to extract', tableRef, myRequest)
            }
            const isActuallyPut = !!(myRequest.changeSpec) // TODO check reliability
            if (!isActuallyPut) {
              console.log('dbcore put used as add not update, calling add instead')
              afterEffectCallback = (completeEvent: Event) => {
                // console.log('ae callback', completeEvent)
                afterEffects.add(myRequest)
              }
            } else {
              // const newObj = myRequest.values[0]

              const obj = await tableRef.get(forKey)

              afterEffectCallback = (completeEvent: Event) => {
                // console.log('ae callback', completeEvent)
                afterEffects.put(myRequest, obj)
              }
            }
          }
          if (type === 'delete') {
            const forKey = myRequest.keys[0]
            const deletedObj = await myRequest.tableRef.get(forKey)
            console.log('dbcore pre delete', myRequest.tableRef, deletedObj)

            afterEffectCallback = (completeEvent: Event) => {
              // console.log('ae callback', completeEvent)
              afterEffects.delete(myRequest, deletedObj)
            }
            if (!deletedObj) {
              afterEffectCallback = (completeEvent: Event) => {
                console.log('ae skipping delete missing obj', completeEvent)
              }
            }
          }

          // call downlevel mutate:
          // eslint-disable-next-line @typescript-eslint/return-await
          return downlevelTable.mutate(myRequest).then(res => {
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

        // Return your extended table:
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
