import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ProductFiltersState } from '@/components/products/ProductFilters'

export interface SavedView {
  id: string
  name: string
  filters: ProductFiltersState
  createdAt: string
  updatedAt: string
}

interface ProductViewsStore {
  savedViews: SavedView[]
  activeViewId: string | null
  
  // Actions
  saveView: (name: string, filters: ProductFiltersState) => void
  updateView: (id: string, filters: ProductFiltersState) => void
  renameView: (id: string, newName: string) => void
  deleteView: (id: string) => void
  loadView: (id: string) => SavedView | null
  setActiveView: (id: string | null) => void
  clearActiveView: () => void
}

export const useProductViewsStore = create<ProductViewsStore>()(
  persist(
    (set, get) => ({
      savedViews: [],
      activeViewId: null,

      saveView: (name, filters) => {
        const newView: SavedView = {
          id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          filters,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        set((state) => ({
          savedViews: [...state.savedViews, newView],
          activeViewId: newView.id,
        }))
      },

      updateView: (id, filters) => {
        set((state) => ({
          savedViews: state.savedViews.map((view) =>
            view.id === id
              ? { ...view, filters, updatedAt: new Date().toISOString() }
              : view
          ),
        }))
      },

      renameView: (id, newName) => {
        set((state) => ({
          savedViews: state.savedViews.map((view) =>
            view.id === id
              ? { ...view, name: newName, updatedAt: new Date().toISOString() }
              : view
          ),
        }))
      },

      deleteView: (id) => {
        set((state) => ({
          savedViews: state.savedViews.filter((view) => view.id !== id),
          activeViewId: state.activeViewId === id ? null : state.activeViewId,
        }))
      },

      loadView: (id) => {
        const view = get().savedViews.find((v) => v.id === id)
        if (view) {
          set({ activeViewId: id })
        }
        return view || null
      },

      setActiveView: (id) => {
        set({ activeViewId: id })
      },

      clearActiveView: () => {
        set({ activeViewId: null })
      },
    }),
    {
      name: 'product-views-storage',
      version: 1,
    }
  )
)
