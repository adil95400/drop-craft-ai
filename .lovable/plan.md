

# Plan : Rendre l'éditeur multimédia accessible

## Problème
La page `/media-editor` existe mais :
1. Elle n'est pas visible dans la navigation sidebar
2. Elle requiert une authentification (route protégée)

## Solution

### Étape 1 — Ajouter l'éditeur média dans la sidebar
Ajouter un lien "Éditeur Média" dans la section appropriée du `ChannableSidebar` (groupe Catalogue ou un groupe dédié Médias).

### Étape 2 — Vérifier le lien dans le registre de routes
S'assurer que `/media-editor` est référencé dans `routesRegistry.ts` pour apparaître dans la recherche rapide (Cmd+K) et le sitemap.

### Étape 3 — Ajouter dans la configuration modules
Référencer le module média dans `MODULE_REGISTRY` de `src/config/modules.ts` pour qu'il apparaisse dans les groupes de navigation.

## Fichiers à modifier
- `src/config/modules.ts` — ajouter module `media-editor`
- `src/config/routesRegistry.ts` — ajouter l'entrée route
- Sidebar (composant de navigation) — ajouter le lien

