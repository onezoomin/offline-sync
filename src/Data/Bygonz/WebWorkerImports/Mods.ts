import Dexie from 'dexie'

export type CompoundKeyNumStr = [number, string]
export type ModCompoundKey = [number /* ts */, string /* modifier */, string /* op */, string /* tableName */, [number /* created */, string /* owner */]]

export enum Operations {
  CREATE='C',
  READ='R',
  UPDATE='U',
  DELETE='D'
}
export const OpCodes = {
  C: 'CREATE',
  R: 'READ',
  U: 'UPDATE',
  D: 'DELETE',
}

// Dgraph graphql+ type
// type Mod {
//   key: String! @id
//   ts: Int64! @search
//   tableName: String! @search(by: [fulltext])
//   forKey: String! @search(by: [fulltext])
//   owner: String! @search(by: [fulltext])
//   modifier: String! @search(by: [fulltext])
//   op: OpCodes
//   log: String!
// }

export class ModObj {
  ts: number
  tableName: string
  forKey: CompoundKeyNumStr
  owner: string
  modifier: string
  op: Operations
  log: Record<any, any>
  constructor (obj: ModObj) {
    Object.assign(this, obj)
  }
}

export class ModVM extends ModObj {
  static getCompoundKey (obj: ModObj): ModCompoundKey {
    // const fullObj= (todoDB[obj.tableName] as Table).get(obj.forKey)
    return [obj.ts, obj.modifier, obj.op, obj.tableName, obj.forKey]
  }

  public forGql (): Record<any, any> { // TODO create type for jsonified mod
    const mod: Record<any, any> = { ...this }
    mod.key = JSON.stringify(ModVM.getCompoundKey(this))
    mod.log = JSON.stringify(this.log)
    mod.forKey = JSON.stringify(this.forKey)
    return mod
  }

  public get opString (): string {
    return OpCodes[this.op]
  }

  public get id (): ModCompoundKey {
    return ModVM.getCompoundKey(this)
  }
}
export const modStoresDef = {
  Mods: '[ts+modifier+op+tableName+forKey], [op+forKey], ts, tableName, forKey, op',
}

let modDB: Dexie

export const getModDB = async () => {
  if (modDB) return modDB
  // const { default: Dexie } = await import('dexie')
  class ModDB extends Dexie {
    Mods: Dexie.Table<ModVM | ModObj, ModCompoundKey>

    constructor () {
      super('Bygonz_ModDB')
      this.version(1).stores(modStoresDef)
      this.Mods.mapToClass(ModVM) //   https://dexie.org/docs/Typescript#storing-real-classes-instead-of-just-interfaces
    }
  }
  modDB = new ModDB()
  return modDB
}
