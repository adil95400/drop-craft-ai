

# Audit des doublons — Pages, imports et routes

## Doublons identifiés

### 1. Imports lazy dupliqués (même page importée dans plusieurs fichiers routes)

| Page | Importée dans | Impact |
|------|--------------|--------|
| `NotificationsPage` | `index.tsx` + `CoreRoutes.tsx` | Double import, double route (`/notifications` + `/dashboard/notifications`) |
| `SyncManagerPage` | `index.tsx` + `CoreRoutes.tsx` | Double route (`/sync-manager` + `/dashboard/sync-manager`) |
| `ProfilePage` | `index.tsx` + `CoreRoutes.tsx` | Double route (`/profile` + `/dashboard/profile`) |
| `CatalogIntelligencePage` | `index.tsx` + `AIRoutes.tsx` | Double route (`/catalog-intelligence` + `/ai/catalog`) |
| `APIDocumentationPage` | `index.tsx` + `IntegrationRoutes.tsx` | Double route (`/api-documentation` + `/integrations/api/docs`) |
| `ContentGenerationPage` | `AIRoutes.tsx` + `MarketingRoutes.tsx` + `AutomationRoutes.tsx` | Triple import (3 modules) |
| `OnboardingWizardPage` | `index.tsx` (from `@/pages/OnboardingWizardPage`) + `CoreRoutes.tsx` (from `@/pages/onboarding/OnboardingWizardPage`) | Possiblement 2 fichiers différents — à vérifier |

### 2. Routes accessibles par 2 chemins différents (doublons fonctionnels)

| Fonctionnalité | Route 1 | Route 2 | Action |
|----------------|---------|---------|--------|
| Notifications | `/notifications` | `/dashboard/notifications` | Supprimer de CoreRoutes |
| Profil | `/profile` | `/dashboard/profile` | Supprimer de CoreRoutes |
| Sync Manager | `/sync-manager` | `/dashboard/sync-manager` | Supprimer de CoreRoutes |
| Catalog Intelligence | `/catalog-intelligence` | `/ai/catalog` | Rediriger `/catalog-intelligence` → `/ai/catalog` |
| API Documentation | `/api-documentation` | `/api/documentation` + `/api-docs` | Garder `/api-docs`, supprimer les autres |
| ContentGeneration | `/ai/content` + `/ai/studio` + `/marketing/content` + `/automation/ai-studio` | 4 routes → même page | Garder `/ai/content`, rediriger les autres |

### 3. MarketingRoutes — Double import identique

```typescript
const CreativeStudioPage = lazy(() => import('@/pages/ContentGenerationPage'));  // doublon
const ContentGenerationPage = lazy(() => import('@/pages/ContentGenerationPage')); // identique
```
Deux variables différentes pointant vers le même fichier.

---

## Plan de nettoyage

### Étape 1 — Nettoyer CoreRoutes.tsx
Retirer les imports et routes déjà gérés dans `index.tsx` :
- `ProfilePage`, `NotificationsPage`, `SyncManagerPage`

### Étape 2 — Dédupliquer les routes standalone dans index.tsx  
- `/catalog-intelligence` → `Navigate` vers `/ai/catalog`
- `/api-documentation` → `Navigate` vers `/api-docs`
- Supprimer l'import `APIDocumentationPage` de `index.tsx` (garder dans `IntegrationRoutes`)

### Étape 3 — Nettoyer MarketingRoutes.tsx
- Supprimer le double import `CreativeStudioPage` (utiliser `ContentGenerationPage` uniquement)

### Étape 4 — Consolider ContentGenerationPage
- Garder l'import dans `AIRoutes.tsx` comme source primaire
- Dans `MarketingRoutes` et `AutomationRoutes`, remplacer par `Navigate` vers `/ai/content`

### Fichiers modifiés
- `src/routes/CoreRoutes.tsx` — retrait de 3 imports/routes dupliqués
- `src/routes/index.tsx` — remplacement de 2 routes par des redirections
- `src/routes/MarketingRoutes.tsx` — suppression du double import
- `src/routes/AutomationRoutes.tsx` — redirection vers `/ai/content`

