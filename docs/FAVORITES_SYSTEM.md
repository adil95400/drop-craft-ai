# Système de Favoris Personnalisables

## 📋 Vue d'ensemble

Système complet de gestion des favoris permettant aux utilisateurs d'épingler leurs modules les plus utilisés pour un accès rapide.

## 🎯 Fonctionnalités

### 1. **Store de Favoris (Zustand + Persist)**
Gestion d'état avec persistance localStorage.

**Fichier:** `src/stores/favoritesStore.ts`

**API:**
```tsx
interface FavoritesState {
  favorites: FavoriteModule[];
  addFavorite: (moduleId: string) => void;
  removeFavorite: (moduleId: string) => void;
  isFavorite: (moduleId: string) => boolean;
  toggleFavorite: (moduleId: string) => void;
  reorderFavorites: (moduleIds: string[]) => void;
  clearFavorites: () => void;
}
```

**Caractéristiques:**
- ✅ Persistance automatique dans localStorage
- ✅ Ordre personnalisable
- ✅ Date d'ajout trackée
- ✅ Synchronisation en temps réel

### 2. **FavoriteButton**
Bouton étoile pour ajouter/retirer des favoris.

**Props:**
```tsx
interface FavoriteButtonProps {
  moduleId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}
```

**Fonctionnalités:**
- ⭐ Animation étoile remplie/vide
- 🎨 Couleur jaune pour favoris actifs
- 💡 Tooltip informatif
- 🚫 Empêche la propagation du clic

### 3. **FavoritesQuickAccess**
Affichage des modules favoris en accès rapide.

**Props:**
```tsx
interface FavoritesQuickAccessProps {
  className?: string;
  maxDisplay?: number;  // Défaut: 6
  compact?: boolean;    // Mode compact ou card
}
```

**Modes d'affichage:**

#### Mode Card (défaut):
- 📊 Grid 2 colonnes
- 🏷️ Badges de plan
- ✨ Animations hover
- 📝 Descriptions

#### Mode Compact:
- 📋 Liste verticale simple
- 🎯 Boutons cliquables
- 💫 Plus léger visuellement

### 4. **FavoritesManager**
Interface complète de gestion des favoris.

**Fonctionnalités:**
- 🔄 Drag & Drop pour réorganiser (avec @dnd-kit)
- 🗑️ Suppression individuelle
- 🚮 Suppression globale
- 📊 Compteur de favoris
- 📱 Responsive

**Technologie:**
- `@dnd-kit/core` pour le drag & drop
- `@dnd-kit/sortable` pour la réorganisation
- Touch-friendly

### 5. **Intégration AppSidebar**

**Section Favoris:**
- ⭐ Affichée en haut de la sidebar
- 🔢 Max 5 favoris visibles
- 🎯 Navigation directe
- ✨ Bouton favori sur hover
- 🏷️ Badges de plan

**Module Items:**
- 💫 Bouton favori sur hover
- 🎨 Transition douce
- 🎯 Non-intrusif

## 🎨 Design System

### Couleurs:
```css
/* Étoile favorite */
.fill-yellow-500       /* Remplissage */
.text-yellow-500       /* Contour */

/* Hover states */
.hover:text-yellow-600
```

### Animations:
- ✅ Fade in/out du bouton favori
- ✅ Scale sur hover
- ✅ Transition fluide étoile
- ✅ Gradient hover sur cards

## 📱 Responsive

| Breakpoint | Layout FavoritesQuickAccess |
|------------|---------------------------|
| Mobile | 1 colonne |
| Tablet | 2 colonnes |
| Desktop | 2 colonnes |

## 🔧 Usage

### Ajouter/retirer un favori:
```tsx
import { FavoriteButton } from '@/components/navigation/FavoriteButton';

<FavoriteButton moduleId="products" />
```

### Afficher les favoris:
```tsx
import { FavoritesQuickAccess } from '@/components/navigation/FavoritesQuickAccess';

// Mode Card
<FavoritesQuickAccess maxDisplay={6} />

// Mode Compact
<FavoritesQuickAccess compact maxDisplay={8} />
```

### Gérer les favoris:
```tsx
import { FavoritesManager } from '@/components/navigation/FavoritesManager';

<FavoritesManager />
```

### Utiliser le store:
```tsx
import { useFavorites } from '@/stores/favoritesStore';

function MyComponent() {
  const { 
    favorites, 
    isFavorite, 
    toggleFavorite,
    reorderFavorites 
  } = useFavorites();
  
  // Utiliser les favoris...
}
```

## 💾 Persistance

Les favoris sont automatiquement sauvegardés dans:
```
localStorage.getItem('dropcraft-favorites')
```

**Format:**
```json
{
  "state": {
    "favorites": [
      {
        "moduleId": "products",
        "addedAt": "2024-01-01T10:00:00.000Z",
        "order": 0
      }
    ]
  },
  "version": 1
}
```

## 🚀 Performance

- ✅ Zustand optimisé
- ✅ Memoïsation des composants
- ✅ Persist middleware léger
- ✅ Rerenders minimisés
- ✅ Lazy loading du DnD

## ♿ Accessibilité

- ✅ ARIA labels sur boutons
- ✅ Tooltips informatifs
- ✅ Keyboard navigation (DnD)
- ✅ Focus management
- ✅ Screen reader friendly

## 🎯 UX Features

### Feedback visuel:
- ⭐ Animation de remplissage étoile
- 💛 Couleur jaune distinctive
- ✨ Hover states clairs
- 🎨 Transitions fluides

### États vides:
- 📝 Message explicatif
- 💡 Instructions d'utilisation
- 🎨 Design cohérent

### Confirmation:
- ⚠️ Confirmation avant suppression globale
- ✅ Feedback immédiat sur actions

## 🔮 Extensions futures

- [ ] Catégories de favoris
- [ ] Favoris partagés (équipe)
- [ ] Raccourcis clavier (Cmd+1-9)
- [ ] Synchronisation cloud
- [ ] Suggestions intelligentes
- [ ] Analytics d'utilisation
- [ ] Export/Import favoris
- [ ] Favoris conditionnels par plan

## 📊 Métriques

Pour tracker l'utilisation:
```tsx
// Exemple d'analytics
const trackFavoriteAdded = (moduleId: string) => {
  analytics.track('favorite_added', {
    moduleId,
    timestamp: Date.now()
  });
};
```

## 🐛 Debugging

Console logs disponibles en dev:
```tsx
// Voir l'état des favoris
console.log(useFavorites.getState());

// Forcer un reset
useFavorites.getState().clearFavorites();
```
