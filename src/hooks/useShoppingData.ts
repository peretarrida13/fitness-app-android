import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'

export interface CustomShoppingItem {
  id: string
  user_id: string
  name: string
  qty: string
  category: string
  checked: boolean
  sort_order: number
  created_at: string
}

const QK = {
  checks: ['shopping_checks'] as const,
  custom: ['shopping_custom_items'] as const,
}

export function useShoppingChecks() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: QK.checks,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_checks')
        .select('item_key')
      if (error) throw error
      return new Set((data as { item_key: string }[]).map((r) => r.item_key))
    },
  })
}

export function useToggleShoppingCheck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemKey, nowChecked }: { itemKey: string; nowChecked: boolean }) => {
      if (nowChecked) {
        const { error } = await supabase.from('shopping_checks').insert({ item_key: itemKey })
        if (error && error.code !== '23505') throw error
      } else {
        const { error } = await supabase.from('shopping_checks').delete().eq('item_key', itemKey)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.checks }),
  })
}

export function useClearShoppingChecks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('shopping_checks').delete().neq('item_key', '')
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.checks }),
  })
}

export function useCustomShoppingItems() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: QK.custom,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_custom_items')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as CustomShoppingItem[]
    },
  })
}

export function useAddCustomShoppingItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, qty, category }: { name: string; qty: string; category: string }) => {
      const { error } = await supabase
        .from('shopping_custom_items')
        .insert({ name, qty, category })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.custom }),
  })
}

export function useDeleteCustomShoppingItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_custom_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.custom }),
  })
}

export function useToggleCustomShoppingItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await supabase
        .from('shopping_custom_items')
        .update({ checked })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.custom }),
  })
}

export function useClearCustomShoppingChecks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shopping_custom_items')
        .update({ checked: false })
        .eq('checked', true)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.custom }),
  })
}
