import { utcTs } from '../Utils/js-utils'

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

export class TimeStamped {
  created?: number
  modified?: number

  constructor (obj: TimeStamped) {
    obj.created = obj.created ?? utcTs()
    obj.modified = obj.modified ?? obj.created

    Object.assign(this, obj)
  }
}
export class ModObj extends TimeStamped {
  log: Record<any, any>
  priKey: [number, string]
  tableName: string
  op: Operations

  constructor (obj: ModObj) {
    super(obj)
    Object.assign(this, obj)
  }
}
export class Mod extends ModObj {
  public get opString (): string {
    return OpCodes[this.op]
  }
}
