import { Link } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { Image } from 'mui-image'
import { h } from 'preact'
import Footer from './Components/Footer'
import { FlexRow } from './Components/Minis'
import ActiveTask from './Components/Tasks/ActiveTask'
import AddTasks from './Components/Tasks/AddTasks'
import CompletedTask from './Components/Tasks/CompletedTask'
import { userAddress } from './Model/Task'
import { useDarkMode } from './Utils/react-utils'

export const App = () => {
  const theme = useDarkMode()
  // useEffect(() => {
  //   console.log('useEffect', tl)
  //   const getlt = async () => {
  //     console.log('calling ww', workerApi)

  //     const add = await workerApi.postMessage({ add: 2 })
  //     console.log('add ww', add)
  //     // settl(await workerApi.listTasks())
  //   }
  //   void getlt()
  // }, [tl])
  return (
    <ThemeProvider theme={theme}>
      <FlexRow className="p-4">
        <Link href='https://github.com/st-ax'>
          <Image width={100} src="https://avatars.githubusercontent.com/u/66159016?s=200&v=4" />
        </Link>
      </FlexRow>

      <div className="container mx-auto lg:w-1/2">
        <h1 className="text-5xl">Todo App - {userAddress.slice(0, 5)} </h1>
        <AddTasks />
        <ActiveTask />
        <hr />
        <CompletedTask />
        <Footer />
      </div>

      {/* <FlexRow className="p-4">
        <Image width={100} src="https://test.broken.url" showLoading
          errorIcon={
            <Tooltip arrow title="Broken Image" placement="right-start">
              <IconButton aria-label="broken"><WarningIcon /></IconButton>
            </Tooltip>}
        />
      </FlexRow> */}
    </ThemeProvider>
  )
}
