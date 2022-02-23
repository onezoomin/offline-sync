import { ApolloClient, DefaultOptions, gql, HttpLink, InMemoryCache } from '@apollo/client/core'
import { ModVM } from './../Model/Mod'
import { utcMsTs } from './bygonz'
// const clientWS = createClient({
//   url: 'wss://dghttp.zt.ax/graphql',
// })
// const wsLink = new WebSocketLink({
//   uri: 'https://dghttp.zt.ax/graphql', // Can test with your Slash GraphQL endpoint (if you're using Slash GraphQL)
//   options: {
//     reconnect: true,
//     // connectionParams: {
//     //   authToken: user.authToken,
//     // },
//   },
// })

const httpLink = new HttpLink({
  uri: 'https://dghttp.zt.ax/graphql',
})

// const splitLink = split(
//   ({ query }) => {
//     const definition = getMainDefinition(query)
//     return (
//       definition.kind === 'OperationDefinition'
//       && definition.operation === 'subscription'
//     )
//   },
//   wsLink,
//   httpLink,
// )
const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
}
const client = new ApolloClient({
  cache: new InMemoryCache({
    resultCaching: false,
  }),
  link: httpLink,
  defaultOptions,
})

// query
// (async () => {
//   const result = await new Promise((resolve, reject) => {
//     let result
//     client.subscribe(
//       {
//         query: '{ hello }',
//       },
//       {
//         next: (data) => (result = data),
//         error: reject,
//         complete: () => resolve(result),
//       },
//     )
//   })

//   expect(result).toEqual({ hello: 'Hello World!' })
// })();

const subQuery = `
subscription {
  queryTask {
    modified
    created
    task
    status
    owner
  }
}`

// https://github.com/enisdenjo/graphql-ws#observable
// function toObservable (operation) {
//   return new Observable((observer) =>
//     clientWS.subscribe(operation, {
//       next: (data) => observer.next(data),
//       error: (err) => observer.error(err),
//       complete: () => observer.complete(),
//     }),
//   )
// }

// export const initSub = () => {
//   const observable = toObservable({ query: subQuery })

//   const subscription = observable.subscribe({
//     next: (data) => {
//     // expect(data).toBe({ data: { ping: 'pong' } })
//       console.log('wsdata:', data)
//     },
//   })
//   return subscription

// // subscription.unsubscribe()
// }

const opts = {
  since: 0,
  searchFilter: '',
}
export const initPoll = (onResults, sinceOpt = 0, searchFilter = '', freq = 60000) => {
  opts.since = sinceOpt
  opts.searchFilter = searchFilter

  setInterval(() => {
    if (searchFilter) {
      searchFilter = `,
      and: {
        task: {
          anyoftext: "${searchFilter}"
        }
      }`
    }
    const taskQuery = `
  query {
    queryTask(filter: {
      modified: {
        gt: ${opts.since}
      }${opts.searchFilter}
    }) {
      modified
      created
      task
      status
      owner
    }
  }`
    // console.log('q', taskQuery)
    opts.since = utcMsTs() // so that next request gets all after now now
    client.query({
      query: gql(taskQuery),
      // variables: {
      //   name,
      // },
    }).then((response) => {
      const tasks = response?.data?.queryTask
      if (tasks?.length) {
        // void todoDB.ActiveTasks.bulkPut(tasks)

        // const mostRecentMod = Math.max(...(tasks.map((o) => o.modified)), 0)
        // console.log(mostRecentMod, opts.since, 'in poll', response)
        onResults(response)
      } else {
        console.log('no tasks returned', response)
      }
    }).catch((e) => {
      console.error(e)
    })
  }, freq)
}

const castJsonModArray = (modishArray): ModVM[] => modishArray.map((eachMod) => {
  const cleanMod = { ...eachMod, log: JSON.parse(eachMod.log), forKey: JSON.parse(eachMod.forKey) }
  delete cleanMod.__typename
  return new ModVM(cleanMod)
})

export const fetchMods = async (since = 0): Promise<ModVM[]> => {
  // console.time('fetchMods took')
  const modQuery = `
  query {
    queryMod(order: { asc: ts },filter: {
      ts: {
        gt: ${since}
      }
    }) {
      ts
      tableName
      forKey
      owner
      modifier
      op
      log
    }
  }`
  let returnArray: ModVM[] = []
  try {
    const response = await client.query({
      query: gql(modQuery),
      // variables: {
      //   name,
      // },
    })
    const mods = response?.data?.queryMod ?? []
    // if (mods?.length) {
    //   // console.log('mod results', response)
    // } else {
    //   // console.log('no mods returned', response)
    // }
    returnArray = castJsonModArray(mods)
  } catch (e) {
    console.warn(e)
  }
  // console.timeEnd('fetchMods took')
  return returnArray
}
