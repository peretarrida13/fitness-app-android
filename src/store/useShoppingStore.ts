import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ShoppingState {
  checked: Record<string, boolean>
  toggle: (key: string) => void
  clearAll: () => void
}

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set) => ({
      checked: {},
      toggle: (key) =>
        set((state) => ({
          checked: { ...state.checked, [key]: !state.checked[key] },
        })),
      clearAll: () => set({ checked: {} }),
    }),
    { name: 'shopping-checked' }
  )
)
