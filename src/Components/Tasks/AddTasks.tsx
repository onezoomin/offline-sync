import { h } from 'preact'
import { useState } from 'preact/hooks'
import { addActiveTask } from '../../Data/data'
import { userAddress } from '../../Data/wallet'
import { Task } from '../../Model/Task'
import { TaskStatus } from '../../Model/TaskStatus'

export default function AddTasks () {
  const [inputValue, setInputValue] = useState('')

  function onSubmit (e: any) {
    e.preventDefault()
    e.target.reset()
    const t = new Task({ task: inputValue, status: TaskStatus.Active, owner: userAddress })
    void addActiveTask(t)
    setInputValue('')
  }
  function addInputChange (task: string) {
    setInputValue(task)
  }

  return (
    <div class="container mx-auto mt-2">
      <form class="my-6" autocomplete="off" onSubmit={onSubmit}>
        <input required minLength={1} maxLength={32} type="text" name="addTask" class="mx-2 rounded-full text-black text-center border border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" id="addTask" placeholder="Add a task" onInput={(e: any) => addInputChange(e.target.value)} />
        <button class="border border-blue-800 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 mx-2 mt-4 rounded-lg px-4" type="submit">Add Task</button>
      </form>
    </div>
  )
}
