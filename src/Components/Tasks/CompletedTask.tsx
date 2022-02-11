import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import IconButton from '@mui/material/IconButton'
import { useLiveQuery } from 'dexie-react-hooks'
import { h } from 'preact'
import { CompletedTasksQuery, delCompletedTask } from '../../Data/data'

export default function CompletedTask () {
  const CompletedTasks = useLiveQuery(CompletedTasksQuery) ?? []

  const onDelete = (index: number) => {
    void delCompletedTask(index)
  }

  return (
    <div class="container overflow-y:auto mx-auto mt-5 pb-2">
      {CompletedTasks?.map((task, i) => {
        const id = task.id ?? i
        return (
          <div key={i} class="flex flex-wrap px-5 md:px-20">
            <p class="flex-grow overflow-ellipsis overflow-hidden w-2/3 line-through">{task.task}</p>
            <IconButton onClick={() => onDelete(id)}>
              <DeleteForeverIcon />
            </IconButton>
          </div>
        )
      })}
    </div>
  )
}
