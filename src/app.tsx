import WarningIcon from '@mui/icons-material/Warning'
import { IconButton, Link, Tooltip } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { useLiveQuery } from 'dexie-react-hooks'
import { Image } from 'mui-image'
import { h } from 'preact'
import Footer from './Components/Footer'
import { FlexRow } from './Components/Minis'
// import InitializingServiceWorker from './Components/ServiceWorker'
import ActiveTask from './Components/Tasks/ActiveTask'
import AddTasks from './Components/Tasks/AddTasks'
import CompletedTask from './Components/Tasks/CompletedTask'
import { ActiveTasksQuery, CompletedTasksQuery } from './Data/data'
import { useDarkMode } from './Utils/react-utils'
// eslint-disable-next-line @typescript-eslint/promise-function-async
// const App = lazy(() => import('./app'))
// <Suspense fallback={<div>Loading...</div>}></Suspense>

export const App = () => {
  // InitializingServiceWorker()
  const ActiveTasks = useLiveQuery(ActiveTasksQuery) ?? []
  const CompletedTasks = useLiveQuery(CompletedTasksQuery) ?? []

  const theme = useDarkMode()
  // useEffect(() => {
  //   localStorage.setItem('ActiveTasks', JSON.stringify(ActiveTasks))
  // }, [ActiveTasks])

  // useEffect(() => {
  //   localStorage.setItem('CompletedTasks', JSON.stringify(CompletedTasks))
  // }, [CompletedTasks])

  console.log(`Active Tasks: ${ActiveTasks.length}`)
  console.log(`Completed Tasks: ${CompletedTasks.length}`)

  return (
    <ThemeProvider theme={theme}>
      <FlexRow className="p-4">
        <Link href='https://github.com/st-ax'>
          <Image width={100} src="https://avatars.githubusercontent.com/u/66159016?s=200&v=4" />
        </Link>
      </FlexRow>

      <div className="container mx-auto lg:w-1/2">
        <h1 className="text-5xl">Todo App</h1>
        <AddTasks />
        <ActiveTask />
        <hr />
        <CompletedTask />
        <Footer />
      </div>

      <FlexRow className="p-4">
        <Image width={100} src="https://test.broken.url" showLoading
          errorIcon={
            <Tooltip arrow title="Broken Image" placement="right-start">
              <IconButton aria-label="broken"><WarningIcon /></IconButton>
            </Tooltip>}
        />
      </FlexRow>
    </ThemeProvider>
  )
}
