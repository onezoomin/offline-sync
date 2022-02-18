import { TaskStatus } from '../Model/TaskStatus'
import { sleep, utcTs } from '../Utils/js-utils'
import { Task } from './../Model/Task'
import { todoDB } from './dexie'

// const getTaskStates = async function getTaskStates () {
//   console.log(await todoDB.ActiveTasks.count(), 'active tasks in db')
//   const currentActiveTasks = await todoDB.ActiveTasks.toArray()
//   console.log(currentActiveTasks)
// }
// void getTaskStates()
// void rxInit()
// void gitInit()
// void initRepli()
// void initHyper() node only for now...

export const addActiveTask = async (newTask: Task) => await todoDB.ActiveTasks.add(new Task(newTask))
export const updateActiveTask = async (taskToUpdate: Task) => await todoDB.ActiveTasks.put({ ...taskToUpdate, modified: utcTs() })
export const delActiveTask = async (idToDelete: [number, string]) => await todoDB.ActiveTasks.delete(idToDelete)
export const delCompletedTask = async (idToDelete: [number, string]) => await todoDB.CompletedTasks.delete(idToDelete)
export const completeActiveTask = async (cTask: Task) => cTask && await todoDB.CompletedTasks.add({ ...cTask, status: TaskStatus.Completed, modified: utcTs() }) && await todoDB.ActiveTasks.delete(cTask.id)

export const ActiveTasksQuery = () => todoDB.ActiveTasks.toArray()
export const CompletedTasksQuery = () => todoDB.CompletedTasks.toArray()

export const mockUpdateStreamer = async () => {
  let eventCount = 0
  const maxUpdates = 23
  const tableRef = todoDB.ActiveTasks

  while (eventCount++ < maxUpdates) {
    let key
    const task = `random ${(Math.random() * 20000).toFixed(2)}`
    if (Math.random() >= 0.3) {
      key = ((await tableRef.toArray())[0] as Task).id
      await tableRef.update(key, { task, modified: utcTs() })
    } else {
      await tableRef.add(new Task({ task, status: TaskStatus.Active }))
    }
    console.log('waiting 10s ', maxUpdates - eventCount, ' more times')

    await sleep(9900)
  }
}

void mockUpdateStreamer()
