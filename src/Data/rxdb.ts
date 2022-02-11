import pouchdbAdapteIdb from 'pouchdb-adapter-idb'
import { createRxDatabase } from 'rxdb'
import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb/plugins/core'
import { addPouchPlugin, getRxStoragePouch } from 'rxdb/plugins/pouchdb'

export async function rxInit () {
  addPouchPlugin(pouchdbAdapteIdb)

  const rxTodo = await createRxDatabase({
    name: 'rx-todo',
    storage: getRxStoragePouch('idb'),
    multiInstance: true, // <- multiInstance (optional, default: true)
    eventReduce: true, // <- eventReduce (optional, default: true)
    ignoreDuplicate: !!(process.env.NODE_ENV === 'dev'), // if we are in dev mode then this avoids duplicate creation errors on HMR
  })

  rxTodo.$.subscribe(changeEvent => console.dir('rxchange', changeEvent))

  const taskSchemaLiteral = {
  // keyCompression: true, // set this to true, to enable the keyCompression
    version: 0,
    title: 'Tasks schema',
    primaryKey: 'id',
    type: 'object',
    properties: {
      id: {
        type: 'string',
      },
      task: {
        type: 'string',
      },
      status: {
        type: 'string',
      },
    },
    required: [
      'id',
      'task',
      'status',
    ],
    indexes: [
      'task',
      'status',
    ],
  } as const // <- It is important to set 'as const' to preserve the literal type
  const schemaTyped = toTypedRxJsonSchema(taskSchemaLiteral)

  // aggregate the document type from the schema
  type TaskDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>

  // create the typed RxJsonSchema from the literal typed object.
  const taskSchema: RxJsonSchema<TaskDocType> = taskSchemaLiteral

  const { activetasks: activeTasksCol } = await rxTodo.addCollections({
    activetasks: {
      schema: taskSchema,
    },
  })
  console.dir(rxTodo.activetasks.name)
  await activeTasksCol.insert({
    id: (Math.random() * 10000).toFixed(0),
    status: 'active',
    task: 'rx t1',
  })
}
