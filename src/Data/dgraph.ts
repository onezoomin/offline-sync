export const addTask = `mutation {
  addTask(input: [
    { 
      created: 1645287739041,
      modified: 1645287739041,
      task: "0x50A random 7539.10",
      status: "Active",
      owner: "0x50A6BD6925E296ACa3EF64460FE6C9e300812df7"
    }
  ]) {
    task {
      created
      owner
      modified
      task
      status
    }
  }
}`
// https://dgraph.io/docs/graphql/mutations/upsert/
export const addTaskUpsert
= `mutation($task: [AddTaskInput!]!) {
  addTask(input: $task, upsert: true) {
    task {
      created
      owner
      modified
      task
      status
    }
  }
} `

export const addTaskResponse = `{
  "data": {
    "addTask": {
      "task": [
        {
          "created": 1645287739041,
          "owner": "0x50A6BD6925E296ACa3EF64460FE6C9e300812df7",
          "modified": 1645287739041,
          "task": "0x50A random 7539.10",
          "status": "Active"
        }
      ]
    }
  },
  "extensions": {
    "touched_uids": 14,
    "tracing": {
      "version": 1,
      "startTime": "2022-02-19T16:52:00.456942189Z",
      "endTime": "2022-02-19T16:52:00.468466905Z",
      "duration": 11524722,
      "execution": {
        "resolvers": [
          {
            "path": [
              "addTask"
            ],
            "parentType": "Mutation",
            "fieldName": "addTask",
            "returnType": "AddTaskPayload",
            "startOffset": 212538,
            "duration": 11303376,
            "dgraph": [
              {
                "label": "preMutationQuery",
                "startOffset": 0,
                "duration": 0
              },
              {
                "label": "mutation",
                "startOffset": 299285,
                "duration": 4296195
              },
              {
                "label": "query",
                "startOffset": 8875336,
                "duration": 2620236
              }
            ]
          }
        ]
      }
    }
  }
}`

const queryDQL = `
{
  node(func: anyoftext(Task.task, "ui") ) @filter(gt(created, 1645361869211)) {
    uid
    expand(_all_) {
      uid
      expand(_all_)
    }
  }
}`

const queryGraphQL = `
query {
  queryTask(filter: {
    task: {
      anyoftext: "ui"
    },
    and: {
      created: {
        gt: 1645361869211
      }
    }
  }) {
    key
    task
    modified
  }
}`
