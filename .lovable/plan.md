

# Audit et Optimisation de la page /import

## Problemes identifies

### 1. Erreur d'accessibilite (Console)
- `DialogContent requires a DialogTitle` - Le modal d'onboarding a bien un `DialogTitle` (ligne 174), mais il est rendu **apres** `DialogHeader`. Le composant Radix detecte l'absence au moment du mount initial car le `DialogTitle` est a l'interieur du contenu conditionnel (`step.title`).

### 2. Fichier monolithique (1135 lignes)
- `ImportHub.tsx` contient toute la logique dans un seul fichier. Les onglets Historique et Canaux representent ~400 lignes de JSX duplique avec les composants existants.

### 3. Tabs overflowing
- 11 onglets dans un seul `TabsList` (Apercu, Methodes, CSV Preview, Regles, Marges, Canaux, AliExpress API, CJ Dropshipping, Amazon API, Statistiques, Historique). Sur ecran < 1400px, les onglets debordent et deviennent inaccessibles.

### 4. Couleurs Tailwind dynamiques non compilees
- Pattern `bg-${action.color}-500/10` et `text-${action.color}-500` (lignes 433-434) ne sont **jamais** compilees par Tailwind (classes dynamiques non detectees au build). Les raccourcis rapides n'ont donc aucune couleur.

### 5. Division par zero potentielle
- Ligne 482 et 674: `imp.processed_rows / imp.total_rows * 100` sans guard `total_rows > 0` au-dela du check parent, risque de NaN si la donnee arrive en etat intermediaire.

### 6. Performances
- 3 composants lazy-loaded (AliExpress, CJ, Amazon) sont charges meme quand l'onglet n'est pas actif car `TabsContent` reste dans le DOM.
- `framer-motion` `AnimatePresence` wraps elements sans `key` unique dans certains cas.

## Plan d'implementation

### Etape 1 — Fix accessibilite DialogTitle
- Dans `ImportOnboardingModal.tsx`, s'assurer que `DialogTitle` est le premier enfant direct de `DialogContent` ou ajouter un `VisuallyHidden` pour le titre par defaut.

### Etape 2 — Fix couleurs Tailwind statiques
- Remplacer les classes dynamiques `bg-${color}-500/10` par des classes statiques mappees dans un objet:
```typescript
const colorMap = {
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', hover: 'hover:bg-orange-500/5' },
  green: { bg: 'bg-green-500/10', text: 'text-green-500', hover: 'hover:bg-green-500/5' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', hover: 'hover:bg-purple-500/5' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', hover: 'hover:bg-blue-500/5' },
};
```

### Etape 3 — Reorganiser les onglets (UX competitor-level)
- Reduire a **6 onglets principaux** : Apercu, Methodes, Canaux, Statistiques, Historique, Outils (regroupe CSV Preview + Regles + Marges).
- Deplacer AliExpress/CJ/Amazon dans la section "Methodes" comme des cards cliquables menant a leurs pages dediees au lieu d'onglets inline.
- Rendre les tabs scrollables sur mobile avec `overflow-x-auto`.

### Etape 4 — Guard division par zero
- Ajouter `Math.round((imp.processed_rows / Math.max(imp.total_rows, 1)) * 100)` partout.

### Etape 5 — Lazy rendering conditionnel des onglets
- Ne monter les `Suspense` + composants lourds que quand l'onglet correspondant est actif (`activeTab === 'aliexpress'`).

### Etape 6 — Extraction des sections en sous-composants
- Extraire `ImportChannelsTab` (~160 lignes) et `ImportHistoryTab` (~80 lignes) en composants dedies dans `src/components/import/tabs/`.
- Cela ramene `ImportHub.tsx` sous 600 lignes.

## Sections techniques

| Fichier | Modification |
|---|---|
| `ImportOnboardingModal.tsx` | Ajouter `VisuallyHidden` wrapper ou reordonner `DialogTitle` |
| `ImportHub.tsx` | Fix couleurs statiques, reorganiser tabs, guards division, lazy conditionnel |
| `src/components/import/tabs/ImportChannelsTab.tsx` | Nouveau - extrait de ImportHub |
| `src/components/import/tabs/ImportHistoryTab.tsx` | Nouveau - extrait de ImportHub |

