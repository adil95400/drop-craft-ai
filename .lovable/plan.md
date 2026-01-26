
# Optimisation Mobile de l'Éditeur de Workflows et Interface d'Automatisation

## Résumé

Transformation de l'éditeur de workflows (`VisualWorkflowEditor`) et des interfaces d'automatisation pour une expérience tactile optimale sur mobile, avec des contrôles drag-and-drop adaptés utilisant `@dnd-kit` (déjà installé dans le projet).

---

## Analyse de l'existant

### Points forts actuels
- Le projet dispose de hooks responsive (`useIsMobile`, `useIsTablet`, `useIsDesktop`)
- `@dnd-kit/core`, `@dnd-kit/sortable` et `@dnd-kit/utilities` sont déjà installés
- `MobileGlobalOptimizer` avec `touchFeedback` et `useSwipeDetector` existent
- Des exemples de drag-and-drop fonctionnels (`SortableBlock`, `FavoritesManager`)

### Points à améliorer
- `VisualWorkflowEditor` n'utilise pas `@dnd-kit` pour réordonner les étapes
- Layout desktop-first avec grilles 3 colonnes non adaptées au mobile
- Boutons trop petits pour les interactions tactiles (< 44px)
- Panneaux latéraux difficiles à utiliser sur petit écran
- Tables dans `WorkflowBuilderDashboard` non optimisées mobile

---

## Fichiers à modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/automation/VisualWorkflowEditor.tsx` | Modifier | Ajouter drag-and-drop tactile, layout responsive |
| `src/components/workflows/WorkflowBuilderDashboard.tsx` | Modifier | Cards au lieu de tables sur mobile |
| `src/components/automation/WorkflowBuilder.tsx` | Modifier | Formulaires tactile-friendly |
| `src/components/automation/MobileWorkflowStep.tsx` | Créer | Composant step draggable optimisé mobile |
| `src/components/automation/MobileStepsPalette.tsx` | Créer | Palette d'étapes en bottom sheet sur mobile |

---

## Détails techniques

### 1. Composant MobileWorkflowStep.tsx (nouveau)

Étape de workflow avec contrôles tactiles optimisés :

- Utilise `useSortable` de `@dnd-kit/sortable`
- Zone de grip (GripVertical) de 48x48px minimum
- Feedback haptique via `navigator.vibrate()`
- Animation de lift pendant le drag (`isDragging`)
- Boutons d'action (supprimer, configurer) avec taille tactile 44px+
- Support des gestes swipe pour actions rapides

### 2. Composant MobileStepsPalette.tsx (nouveau)

Palette d'étapes disponibles en mode sheet/drawer sur mobile :

- Utilise le composant `Sheet` (vaul) existant
- Bouton flottant "+" pour ouvrir la palette
- Grille de catégories avec icônes larges (56x56px)
- Ajout d'étape par tap (au lieu de drag depuis le panneau)
- Fermeture automatique après sélection

### 3. Modifications VisualWorkflowEditor.tsx

```text
AVANT (desktop-only):
┌────────────────────────────────────────────────────────┐
│  Config Workflow (2 cols)  │  Étapes Disponibles      │
├────────────────────────────┼───────────────────────────┤
│  Liste Étapes (1 col)      │  Config Étape Sélect.    │
└────────────────────────────┴───────────────────────────┘

APRÈS (mobile-first responsive):
MOBILE:
┌─────────────────────────────┐
│  Config Workflow (stacked)  │
├─────────────────────────────┤
│  Liste Étapes (draggable)   │
│  [+ Ajouter étape] FAB      │
├─────────────────────────────┤
│  Config Étape (sheet)       │
└─────────────────────────────┘

DESKTOP (inchangé avec améliorations):
┌────────────────────────────────────────────────────────┐
│  Config + Étapes Dispo (2/3 + 1/3)                     │
├────────────────────────────────────────────────────────┤
│  Steps List (1/2) │ Step Config (1/2)                  │
└────────────────────────────────────────────────────────┘
```

Modifications clés :
- Import `DndContext`, `SortableContext`, `closestCenter`, `arrayMove`
- Sensors configurés pour touch : `TouchSensor` avec `activationConstraint: { delay: 150 }`
- `PointerSensor` pour desktop avec fallback
- Fonction `handleDragEnd` pour réordonner les étapes
- Layout conditionnel basé sur `useIsMobile()`
- Configuration d'étape dans un `Sheet` sur mobile au lieu d'un panneau latéral

### 4. Modifications WorkflowBuilderDashboard.tsx

- Remplacer `Table` par des `Card` empilées sur mobile
- TabsList avec `overflow-x-auto` et `touch-action: pan-x`
- Stats grid : `grid-cols-2` sur mobile au lieu de `grid-cols-4`
- Boutons d'action avec icônes uniquement sur mobile (tooltip au tap)

### 5. Modifications WorkflowBuilder.tsx

- Inputs avec `min-h-[44px]` pour cibles tactiles
- Espacement augmenté entre les champs (`space-y-5` au lieu de `space-y-4`)
- Select avec menu déroulant pleine largeur sur mobile
- Boutons flottants pour "Ajouter étape" en position sticky

---

## Configuration dnd-kit pour le tactile

```typescript
const sensors = useSensors(
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,        // Délai pour distinguer scroll vs drag
      tolerance: 5,      // Tolérance de mouvement
    },
  }),
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,       // Distance min avant activation
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

---

## Améliorations UX tactiles

1. **Feedback haptique** : Vibration légère (10ms) au début du drag
2. **Visual lift** : Scale 1.02 + shadow-lg pendant le drag
3. **Drop indicator** : Ligne bleue animée pour indiquer la position de drop
4. **Swipe actions** : Swipe gauche pour supprimer une étape (avec confirmation)
5. **Touch targets** : Minimum 44x44px pour toutes les zones interactives
6. **Scroll smooth** : `scroll-snap-type: y mandatory` pour la liste d'étapes

---

## CSS/Tailwind à ajouter

Classes responsive pour l'éditeur :
- `touch-action-manipulation` pour éviter le zoom accidentel
- `select-none` sur les éléments draggables
- `active:scale-95` pour feedback visuel au tap
- `min-h-[44px]` sur tous les boutons tactiles

---

## Tests recommandés

1. Tester le drag sur iOS Safari (comportement particulier du touch)
2. Vérifier que le scroll vertical fonctionne pendant le drag horizontal
3. Tester avec des listes longues (+10 étapes) pour performance
4. Valider l'accessibilité avec VoiceOver/TalkBack
