import Dexie from 'dexie'
import { Mod } from './Mod'

const addTableRefs = (dexieInstance: Dexie) => dexieInstance.tables.forEach(table => {
  dexieInstance[table.name] = table
})

export class BygonzDB extends Dexie {
  // [x: string]: any
  // Declare implicit table properties. (just to inform Typescript. Instanciated by Dexie in stores() method)
  Mods: Dexie.Table<Mod, [number, string]> // number = type of the priKey
  // ...other tables go here...
  static singletonInstance: BygonzDB

  async init () {
    console.log('init')
  }

  static async getInitializedInstance () {
    if (!this.singletonInstance) {
      this.singletonInstance = new BygonzDB()
      await this.singletonInstance.init()
    }
    return this.singletonInstance
  }

  constructor () {
    super('BygonzDB')

    this.version(1).stores({
      Mods: '[modified+tableName+op], tableName, op, modified, priKey',
      // ...other tables go here...//
    })

    addTableRefs(this)
    this.Mods.mapToClass(Mod) //   https://dexie.org/docs/Typescript#storing-real-classes-instead-of-just-interfaces
  }
}
