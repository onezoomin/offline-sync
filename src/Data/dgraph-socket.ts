import { ApolloClient, gql, HttpLink, InMemoryCache } from '@apollo/client/core'
import { utcTs } from '../Utils/js-utils'
import { todoDB } from './WebWorker'
// import { getMainDefinition } from '@apollo/client/utilities/graphql/getFromAST'
// import { WebSocketLink } from '@apollo/link-ws/lib/webSocketLink'
// import { createClient } from 'graphql-ws'
// const client = createClient({
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

const client = new ApolloClient({
  cache: new InMemoryCache({
    resultCaching: false,
  }),
  link: httpLink,
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

// const subQuery = gql`
// subscription {
//   queryTask(filter: {
//     task: {
//       anyoftext: "ui"
//     },
//     and: {
//       created: {
//         gt: ${since}
//       }
//     }
//   }) {
//     key
//     task
//     modified
//   }
// }`

// https://github.com/enisdenjo/graphql-ws#observable
// function toObservable (operation) {
//   return new Observable((observer) =>
//     client.subscribe(operation, {
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
export const initPoll = (onResults, sinceOpt = 0, searchFilter = '', freq = 5000) => {
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
    console.log('q', taskQuery)
    opts.since = utcTs() // so that next request gets all after now now
    client.query({
      query: gql(taskQuery),
      // variables: {
      //   name,
      // },
    }).then((response) => {
      const tasks = response?.data?.queryTask
      if (tasks?.length) {
        void todoDB.ActiveTasks.bulkPut(tasks)

        const mostRecentMod = Math.max(...(tasks.map((o) => o.modified)))
        console.log(mostRecentMod, opts.since, 'in poll', response)
        onResults(response)
      } else {
        console.log('no results', response)
      }
    }).catch((e) => {
      console.log(e)
    })
  }, freq)
}
