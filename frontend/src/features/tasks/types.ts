export interface Task {
  id: number
  name: string
  deadline_at: string
  description: string | null
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
  offsets: number[]
}
