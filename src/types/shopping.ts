export interface ShoppingItem {
  name: string
  qty: string
}

export type ShoppingData = Record<string, ShoppingItem[]>
