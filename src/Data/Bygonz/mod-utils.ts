import { PromiseExtended, Table } from 'dexie'
import { ModVM, Operations } from '../../Model/Mod'
import { CompoundKeyNumStr, TaskVM } from '../../Model/Task'
const all = Promise.all.bind(Promise) // https://stackoverflow.com/a/48399813/2919380

export const checkWorker = (...msg) => {
  // run this in global scope of window or worker. since window.self = window, we're ok
  if (self.document === undefined) {
    console.log('Worker!', ...msg)
  } else {
    console.log(self.document, ' sad trombone. not worker ', ...msg)
  }
}
checkWorker('top of mod utils')

export const hookState = {
  isSuspended: false,
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
  hookState.isSuspended = true
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
    hookState.isSuspended = false
  } catch (e) {
    console.error('applying mods', e)
    hookState.isSuspended = false
  }
}
