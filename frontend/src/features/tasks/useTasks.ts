import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import type { Task } from './types'

export function useTasksQuery() {
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get<Task[]>('/api/v1/tasks/')
      return data
    },
  })
}

interface CreateTaskPayload {
  name: string
  deadline_at: string
  description?: string
}

export function useCreateTask() {
  return useMutation<Task, Error, CreateTaskPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Task>('/api/v1/tasks/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
