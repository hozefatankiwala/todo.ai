import { createBrowserRouter } from 'react-router'
import TaskList from './features/tasks/TaskList'
import TaskDetail from './features/tasks/TaskDetail'
import ArchiveView from './features/tasks/ArchiveView'

export const router = createBrowserRouter([
  { path: '/', element: <TaskList /> },
  { path: '/tasks/:taskId', element: <TaskDetail /> },
  { path: '/archive', element: <ArchiveView /> },
])
