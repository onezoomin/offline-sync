import Dexie from 'dexie'
import { ModOpts } from './Mod'

const addTableRefs = (dexieInstance: Dexie) => dexieInstance.tables.forEach(table => {
  dexieInstance[table.name] = table
})

export class ModDB extends Dexie {
  // [x: string]: any
  // Declare implicit table properties. (just to inform Typescript. Instanciated by Dexie in stores() method)
  Mods: Dexie.Table<ModOpts, [number, string]> // number = type of the priKey
  // ...other tables go here...
  static singletonInstance: ModDB

  async init () {
    console.log('init')
  }

  static async getInitializedInstance () {
    if (!this.singletonInstance) {
      this.singletonInstance = new ModDB()
      await this.singletonInstance.init()
    }
    return this.singletonInstance
  }

  constructor () {
    super('ModDB')

    this.version(1).stores({
      Mods: '[modified+priKey], modified, priKey',
      // ...other tables go here...//
    })

    addTableRefs(this)
    this.Mods.mapToClass(ModOpts) //   https://dexie.org/docs/Typescript#storing-real-classes-instead-of-just-interfaces
  }
}
