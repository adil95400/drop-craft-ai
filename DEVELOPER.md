# DropCraft AI — Guide Développeur

## Démarrage rapide

```bash
# Installer les dépendances
bun install

# Lancer le serveur de développement
bun run dev

# Lancer les tests
bun run test

# Build de production
bun run build
```

## Architecture

```
src/
├── assets/              # Images, fonts, fichiers statiques
├── components/          # Composants React réutilisables
│   ├── ui/              # Primitives shadcn/ui
│   ├── common/          # ErrorBoundary, EmptyState, etc.
│   ├── dashboard/       # Widgets du dashboard (lazy-loaded)
│   ├── products/        # Gestion produits + Command Center
│   ├── import/          # Pipeline d'import multi-source
│   ├── ai/              # Assistant IA global
│   └── ...
├── contexts/            # Providers React (Auth, Theme, Modal)
├── hooks/               # Custom hooks (useProducts, useOrders, etc.)
├── integrations/        # Client Supabase (auto-généré, NE PAS MODIFIER)
├── lib/                 # Utilitaires (validation Zod, i18n, sentry)
├── pages/               # Pages routées (150+)
├── routes/              # Modules de routing (26 fichiers, lazy-loaded)
├── services/            # Services métier (API client, cache, sync)
├── stores/              # Zustand stores
├── test/                # Setup Vitest + helpers
└── types/               # Types TypeScript partagés
```

## Conventions

### Routing
- **Lazy loading** systématique sur toutes les routes
- Modules thématiques dans `src/routes/` (ProductRoutes, OrderRoutes, etc.)
- `LegacyRedirectHandler` centralise les anciennes URLs

### Design System
- **Tokens HSL** dans `index.css` (jamais de couleurs hardcodées)
- Composants shadcn/ui customisés via `class-variance-authority`
- Dark mode complet via `next-themes`

### Base de données
- **RLS 100%** sur toutes les tables métier (`auth.uid() = user_id`)
- Migrations SQL dans `supabase/migrations/`
- Types auto-générés dans `src/integrations/supabase/types.ts`

### Sécurité
- JWT + RLS par défaut, `service_role` = exception documentée
- `SECURITY DEFINER` fonctions avec `search_path = public`
- Clés API hashées SHA-256, validation Zod sur tous les inputs
- Rate limiting sur les endpoints utilisateur

### Tests
- **Vitest** : tests unitaires (`src/**/*.test.ts`)
- **Playwright** : tests E2E (`tests/`)
- Setup : `src/test/setup.ts`

### IA
- Lovable AI (Gemini) intégré — pas de clé API requise
- Edge functions dans `supabase/functions/`

## Fichiers auto-générés (NE PAS MODIFIER)
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`
- `supabase/config.toml`

## Edge Functions
- Code dans `supabase/functions/<name>/index.ts`
- Pattern JWT-first via `_shared/jwt-auth.ts`
- CORS headers obligatoires pour les appels web
- Déployées automatiquement

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `bun run dev` | Serveur de développement |
| `bun run build` | Build de production |
| `bun run test` | Tests unitaires Vitest |
| `bun run lint` | Linting ESLint |
