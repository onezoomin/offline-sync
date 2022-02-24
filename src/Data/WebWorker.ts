import { Table } from 'dexie' // importing types and interfaces up here seems fine most others trigger the HTMLElement error

export const checkWorker = (...msg) => {
  // run this in global scope of window or worker. since window.self = window, we're ok
  if (self.document === undefined) {
    console.log('Worker!', ...msg)
  } else {
    console.log(self.document, ' sad trombone. not worker ', ...msg)
  }
}
checkWorker('top of worker')

// hack to avoid overlay.ts's dom assumptions inspired by https://stackoverflow.com/questions/58672942/htmlelement-is-not-defined-nativescript-vue
self.HTMLElement = function () {
  return {}
}
self.customElements = {
  get () {
    return []
  },
}

export let todoDBwwRef
export let fetchAndApplyMods
export let userAddress: string = 'premessage'

self.onmessage = async (e) => {
  if (e.data.cmd === 'init') {
    checkWorker('on message in bygonz worker', e)
    userAddress = e.data.userAddress
    // try {

    // } catch (error) {
    //   console.error('instantiate todoDB', error)
    // }

    try {
      const { utcMsTs } = await import('./bygonz')
      const { todoDB } = await import('./dexie')
      todoDBwwRef = todoDB
      // checkWorker(utcMsTs(), 'todoDB', todoDB)
      const { getCreatingHookForTable, getDeletingHookForTable, getUpdateHookForTable, opLogRollup } = await import('./dexie-sync-hooks')

      const getTableHooks = {
        updating: getUpdateHookForTable,
        creating: getCreatingHookForTable,
        deleting: getDeletingHookForTable,
      }
      const objThatOnlyLivesHere: Record<string, (tableName: any) => (modifications: any, forKey: any, obj: any) => void> = {}
      for (const { name: eachTableName } of todoDB.tables) {
        for (const eachEvent of ['updating', 'creating', 'deleting']) {
          objThatOnlyLivesHere[`${eachTableName}_${eachEvent}}`] = (getTableHooks[eachEvent](eachTableName)).bind(self);
          (todoDB[eachTableName] as Table).hook(eachEvent, objThatOnlyLivesHere[`${eachTableName}_${eachEvent}}`])
        }
      // todoDB[eachTableName].hook('creating', getCreatingHookForTable(eachTableName))
      // todoDB[eachTableName].hook('deleting', getDeletingHookForTable(eachTableName))
      }

      const setupWWDB = async () => {
        checkWorker(utcMsTs(), 'todoDB with hooks', todoDB)

        fetchAndApplyMods = async () => {
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
        // const mostRecentMod = Math.max(...(tasks.map((o) => { return o.modified })))

        // const onTaskPoll = (tasksResult) => {
        //   console.log('ww poll result', tasksResult)
        // }
        // initPoll(onTaskPoll)

        const mockUpdateStreamer = async () => {
          const format = (await import('date-fns/format')).default
          const fromUnixTime = (await import('date-fns/fromUnixTime')).default
          const { Task, TaskVM } = await import('../Model/Task')
          const { TaskStatus } = await import('../Model/TaskStatus')
          const { sleep } = await import('../Utils/js-utils')
          let eventCount = 0
          const maxUpdates = 6
          const tableRef: Table = todoDB.ActiveTasks

          while (eventCount++ < maxUpdates) {
            let key, task

            const taskArray = (await tableRef.toArray()) as TaskVM[]
            const addPercentage = 0.25
            if (Math.random() >= addPercentage && taskArray.length) {
              key = (taskArray[Math.floor(Math.random() * taskArray.length)])?.id
              const modified = utcMsTs()
              const modTime = format(fromUnixTime(modified / 1000), 'H:mm:ss:SSS')
              task = `upd by ${userAddress.slice(0, 5)} @ ${modTime}`
              await tableRef.update(key, { task, modified })
            } else {
              task = `${userAddress.slice(0, 5)} create ${(Math.random() * 2000).toFixed(0)}`
              await tableRef.add(new Task({ task, owner: userAddress, status: TaskStatus.Active }))
            }
            console.log('will automock in 30s ', maxUpdates - eventCount, ' more times')

            await sleep(30000)
          }
        }

        void mockUpdateStreamer()

        void opLogRollup(true, true)
        const rollupInterval = setInterval(() => {
          void opLogRollup()
        }, 10000)
        // initSub()
        return todoDB
      }

      await setupWWDB()
    } catch (error) {
      console.error(error)
    }
  }
}
