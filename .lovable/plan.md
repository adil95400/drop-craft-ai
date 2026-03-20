

# Plan de migration : Suppression des dépendances Lovable Cloud

## Contexte

Votre application a **deux types de dépendances** sur Lovable :

1. **Lovable Auth (Google OAuth)** — Le fichier `src/integrations/lovable/index.ts` existe mais **n'est importé nulle part**. Votre `UnifiedAuthContext` utilise déjà `supabase.auth.signInWithOAuth` directement. **Aucun impact.**

2. **Lovable AI Gateway** — C'est la dépendance majeure : **74 Edge Functions** appellent `https://ai.gateway.lovable.dev/v1/chat/completions` avec `LOVABLE_API_KEY`. Si vous désactivez Cloud, ces fonctions cesseront de fonctionner.

## Ce qui est sûr à désactiver

| Composant | Statut | Impact |
|-----------|--------|--------|
| Lovable Auth (Google OAuth) | Non utilisé | Aucun — déjà Supabase natif |
| `src/integrations/lovable/index.ts` | Non importé | Peut être supprimé |
| `@lovable.dev/cloud-auth-js` | Non utilisé | Peut être retiré du `package.json` |

## Ce qui cassera si vous désactivez Cloud

| Composant | Fichiers affectés | Impact |
|-----------|-------------------|--------|
| AI Gateway (`ai.gateway.lovable.dev`) | **74 Edge Functions** | Toutes les fonctionnalités IA (SEO, pricing, enrichissement, traductions, recommandations, etc.) |
| `LOVABLE_API_KEY` secret | Toutes les fonctions ci-dessus | Authentification vers le gateway IA |

## Plan d'implémentation

### Étape 1 — Nettoyage du code frontend (sans risque)
- Supprimer `src/integrations/lovable/index.ts`
- Retirer `@lovable.dev/cloud-auth-js` du `package.json`
- Retirer `https://*.lovable.app` de la CSP dans `src/lib/security-headers.ts`

### Étape 2 — Migration IA : Lovable Gateway → OpenAI direct (effort majeur)
Dans les **74 Edge Functions**, remplacer :

```text
AVANT:
  url: https://ai.gateway.lovable.dev/v1/chat/completions
  header: Authorization: Bearer ${LOVABLE_API_KEY}
  model: "openai/gpt-5-nano"

APRÈS:
  url: https://api.openai.com/v1/chat/completions
  header: Authorization: Bearer ${OPENAI_API_KEY}
  model: "gpt-4o-mini" (ou équivalent)
```

Cela implique :
- Ajouter un secret `OPENAI_API_KEY` dans votre backend
- Créer un module utilitaire partagé (`supabase/functions/_shared/ai-client.ts`) pour centraliser l'appel OpenAI
- Mettre à jour les noms de modèles (le format `openai/gpt-5-nano` est spécifique au gateway Lovable)
- Tester chaque fonction après migration

### Étape 3 — Vérification de la base de données
Votre base de données Supabase est **votre propre projet** hébergé sur Supabase. Lovable Cloud l'a provisionné mais il vous appartient. Aucune donnée ne sera perdue.

### Étape 4 — Désactivation Cloud
Une fois les étapes 1-3 terminées, désactiver Cloud dans **Settings → Connectors → Lovable Cloud → Disable Cloud**.

> **Important** : La désactivation de Cloud est irréversible pour ce projet. Assurez-vous que la migration IA est terminée avant.

## Résumé des risques

```text
Composant              | Risque si Cloud désactivé | Action requise
─────────────────────────────────────────────────────────────────────
Auth (Google)          | AUCUN                     | Déjà migré
Base de données        | AUCUN                     | Vous la possédez
Storage                | AUCUN                     | Supabase natif
Edge Functions (code)  | AUCUN                     | Code reste le vôtre
AI Gateway (74 fonc.)  | CRITIQUE                  | Migrer vers OpenAI
```

### Recommandation

Commencer par l'**Étape 2** (migration IA) car c'est le seul bloquant réel. Les étapes 1, 3 et 4 sont triviales et sans risque.

Souhaitez-vous que je commence la migration des 74 Edge Functions vers l'API OpenAI directe ?

