export interface Ingredient {
  name: string
  macro: string
  kcal?: number
}

export interface MealStep {
  text: string
  tip?: string | null
}

export interface Meal {
  id: string
  icon: string
  name: string
  time: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  ingredients: Ingredient[]
  steps: MealStep[]
}

export interface DayMacros {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface MealDay {
  name: string
  macros: DayMacros
  meals: Meal[]
}
