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

export function useTaskQuery(taskId: number) {
  return useQuery<Task>({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      const { data } = await api.get<Task>(`/api/v1/tasks/${taskId}`)
      return data
    },
    enabled: !isNaN(taskId),
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

interface UpdateTaskPayload {
  id: number
  name?: string
  deadline_at?: string
  description?: string | null
}

export function useUpdateTask() {
  return useMutation<Task, Error, UpdateTaskPayload>({
    mutationFn: async ({ id, ...fields }) => {
      const { data } = await api.patch<Task>(`/api/v1/tasks/${id}`, fields)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', data.id] })
    },
  })
}
