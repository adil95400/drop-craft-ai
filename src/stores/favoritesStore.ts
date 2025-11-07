import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteModule {
  moduleId: string;
  addedAt: string;
  order: number;
}

interface FavoritesState {
  favorites: FavoriteModule[];
  addFavorite: (moduleId: string) => void;
  removeFavorite: (moduleId: string) => void;
  isFavorite: (moduleId: string) => boolean;
  reorderFavorites: (moduleIds: string[]) => void;
  clearFavorites: () => void;
  toggleFavorite: (moduleId: string) => void;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (moduleId: string) => {
        const { favorites } = get();
        
        // Vérifier si déjà en favoris
        if (favorites.some(f => f.moduleId === moduleId)) {
          return;
        }

        set({
          favorites: [
            ...favorites,
            {
              moduleId,
              addedAt: new Date().toISOString(),
              order: favorites.length
            }
          ]
        });
      },

      removeFavorite: (moduleId: string) => {
        set(state => ({
          favorites: state.favorites
            .filter(f => f.moduleId !== moduleId)
            .map((f, idx) => ({ ...f, order: idx })) // Réorganiser les ordres
        }));
      },

      isFavorite: (moduleId: string) => {
        return get().favorites.some(f => f.moduleId === moduleId);
      },

      toggleFavorite: (moduleId: string) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        
        if (isFavorite(moduleId)) {
          removeFavorite(moduleId);
        } else {
          addFavorite(moduleId);
        }
      },

      reorderFavorites: (moduleIds: string[]) => {
        const { favorites } = get();
        
        set({
          favorites: moduleIds.map((moduleId, idx) => {
            const existing = favorites.find(f => f.moduleId === moduleId);
            return {
              moduleId,
              addedAt: existing?.addedAt || new Date().toISOString(),
              order: idx
            };
          })
        });
      },

      clearFavorites: () => {
        set({ favorites: [] });
      }
    }),
    {
      name: 'dropcraft-favorites',
      version: 1
    }
  )
);
