import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import type { Todo } from '@/types/supabase'

const QK = {
  all: ['todos'] as const,
}

export function useTodos() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: QK.all,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) return [] as Todo[]
      return data as Todo[]
    },
  })
}

export function useAddTodo() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase
        .from('todos')
        .insert({ user_id: user!.id, title, completed: false })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.all }),
  })
}

export function useToggleTodo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from('todos').update({ completed }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.all }),
  })
}

export function useDeleteTodo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('todos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.all }),
  })
}
