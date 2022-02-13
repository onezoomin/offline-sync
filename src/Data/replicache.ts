import { nanoid } from 'nanoid'
import { Replicache } from 'replicache'

export const repliTodoDB = new Replicache({
  requestOptions: {
    minDelayMs: 5000,
  },
  pushURL: 'https://wh.n8n.zt.ax/webhook/replicache-push',
  pullURL: 'https://wh.n8n.zt.ax/webhook/replicache-pull',
  logLevel: 'debug', // TODO PR LogLevel.DEBUG
  // useMemstore: true,
  mutators: {
    createTodo: (tx, { id = nanoid(), ...args }) => {
      console.log('repliput', id, args)
      void tx.put(`todo/${id}`, args)
    },
  },
})

export async function initRepli () {
  await repliTodoDB.mutate.createTodo({
    id: nanoid(),
    order: 7,
    text: '7 todo 7!',
  })
  repliTodoDB.subscribe(tx => tx.scan({ prefix: 'todo/' }).entries().toArray(), {
    onData: data => console.log('repli sub todos', data),
  })
}
