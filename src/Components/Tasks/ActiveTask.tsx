import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { IconButton } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { h } from 'preact'
import { useRef } from 'preact/hooks'
import { ActiveTasksQuery, completeActiveTask, delActiveTask, ModificationsQuery, updateActiveTask } from '../../Data/data'
import { Task, TaskVM } from '../../Model/Task'
import Editable from '../Editable'

function TaskMods ({ task: { id } }) {
  const mods = useLiveQuery(() => ModificationsQuery(id)) ?? []
  return (
    !mods.length ? null : <div>{mods.length}</div>
  )
}
export default function ActiveTask () {
  const ActiveTasks = useLiveQuery(ActiveTasksQuery) ?? []

  const onCheck = (checkedTask: Task) => {
    console.log(checkedTask)
    void completeActiveTask(checkedTask)
  }
  const onDelete = (deletedTask: TaskVM) => {
    void delActiveTask(deletedTask.id)
  }
  const inputRef = useRef<any>()

  function updateTask (task: Task, newVal) {
    task.task = newVal
    void updateActiveTask(task)
  }

  return (
    <div class="container overflow-y:auto mx-auto mb-5">
      {ActiveTasks?.map((task: TaskVM, i) => {
        const id = task.id ?? i
        return (
          <div key={id} class="flex flex-wrap px-5 md:px-20">
            <IconButton onClick={() => onCheck(task)}>
              <CheckBoxOutlineBlankIcon />
            </IconButton>

            <Editable
                class="flex-grow w-2/3"
                text={task.task}
                placeholder="Write a task name"
                type="input"
                childRef={inputRef}
                onEnter = {(e: KeyboardEvent) => updateTask(task, (e.target as HTMLInputElement)?.value)}
            />
            <TaskMods {...{ task }} />
            <IconButton onClick={() => onDelete(task)}>
              <DeleteForeverIcon />
            </IconButton>
          </div>
        )
      })}
    </div>
  )
}
