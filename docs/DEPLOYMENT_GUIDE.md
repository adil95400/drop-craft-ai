# Guide de déploiement - Drop Craft AI

## Vue d'ensemble

Ce guide couvre le déploiement complet de Drop Craft AI en production, incluant le frontend, le backend (Edge Functions), et la base de données.

---

## Prérequis

- Compte Supabase (avec projet créé)
- Compte GitHub (pour CI/CD)
- Domaine personnalisé (optionnel)
- Variables d'environnement configurées

---

## Configuration initiale

### 1. Supabase Project Setup

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet local au projet Supabase
supabase link --project-ref your-project-ref
```

### 2. Variables d'environnement

Créer un fichier `.env.production` :

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Sentry (monitoring)
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SENTRY_ENVIRONMENT=production

# Analytics (optionnel)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

Configurer les secrets Supabase :

```bash
# Secrets pour Edge Functions
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set SHOPIFY_API_KEY=...
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set ALIEXPRESS_API_KEY=...
```

---

## Déploiement de la base de données

### 1. Migrations

```bash
# Vérifier les migrations
supabase db diff --use-migra

# Créer une nouvelle migration si nécessaire
supabase migration new migration_name

# Appliquer les migrations en production
supabase db push
```

### 2. Seed data (optionnel)

```sql
-- supabase/seed.sql
INSERT INTO categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Clothing', 'clothing'),
  ('Home & Garden', 'home-garden');
```

```bash
# Appliquer le seed
supabase db execute --file supabase/seed.sql
```

### 3. RLS Policies

Vérifier que toutes les tables sensibles ont des politiques RLS :

```sql
-- Vérifier l'activation RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Activer RLS sur une table si nécessaire
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

---

## Déploiement des Edge Functions

### 1. Vérifier la configuration

```toml
# supabase/config.toml
[functions]
enabled = true

[functions."shopify-sync"]
verify_jwt = true

[functions."public-api"]
verify_jwt = false
```

### 2. Déployer toutes les fonctions

```bash
# Déployer toutes les Edge Functions
supabase functions deploy

# Ou déployer une fonction spécifique
supabase functions deploy shopify-sync
```

### 3. Tester les fonctions

```bash
# Tester avec curl
curl -i --location --request POST \
  'https://your-project.supabase.co/functions/v1/shopify-sync' \
  --header 'Authorization: Bearer YOUR_JWT' \
  --header 'Content-Type: application/json' \
  --data '{"action":"sync_products"}'
```

---

## Déploiement du Frontend

### Option 1: Lovable (Recommandé)

Le déploiement via Lovable est automatique :

1. Cliquer sur "Publish" dans l'interface Lovable
2. Les changements sont automatiquement déployés
3. L'application est disponible sur `your-project.lovable.app`

#### Configurer un domaine personnalisé

1. Aller dans Project > Settings > Domains
2. Ajouter votre domaine (ex: `dropcraftai.com`)
3. Configurer les enregistrements DNS :

```
Type: CNAME
Name: @ (ou www)
Value: cname.lovable.app
```

### Option 2: Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

Configuration `vercel.json` :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### Option 3: Netlify

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy --prod
```

Configuration `netlify.toml` :

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  VITE_SUPABASE_URL = "https://your-project.supabase.co"
```

---

## CI/CD avec GitHub Actions

### Workflow de déploiement automatique

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test
        
      - name: Run linter
        run: npm run lint

  deploy-functions:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Deploy Edge Functions
        run: |
          supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Secrets GitHub à configurer

```
Settings > Secrets and variables > Actions > New repository secret

- SUPABASE_PROJECT_REF
- SUPABASE_ACCESS_TOKEN
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VERCEL_TOKEN (si Vercel)
- VERCEL_ORG_ID (si Vercel)
- VERCEL_PROJECT_ID (si Vercel)
```

---

## Configuration DNS

### Pour domaine principal

```
Type: A
Name: @
Value: [IP de votre hébergeur]

Type: CNAME
Name: www
Value: your-app.vercel.app
```

### Pour sous-domaine API

```
Type: CNAME
Name: api
Value: your-project.supabase.co
```

---

## SSL/TLS

### Lovable
SSL automatique via Let's Encrypt.

### Vercel/Netlify
SSL automatique, rien à configurer.

### Supabase
SSL activé par défaut sur tous les endpoints.

---

## Monitoring et Observabilité

### 1. Sentry (Error Tracking)

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

### 2. Supabase Logs

```bash
# Voir les logs Edge Functions
supabase functions logs --project-ref your-project-ref

# Logs avec filtre
supabase functions logs shopify-sync --filter "error"

# Logs database
supabase db logs --project-ref your-project-ref
```

### 3. Google Analytics (optionnel)

```typescript
// src/lib/analytics.ts
import ReactGA from 'react-ga4';

export function initAnalytics() {
  if (import.meta.env.VITE_GA_TRACKING_ID) {
    ReactGA.initialize(import.meta.env.VITE_GA_TRACKING_ID);
  }
}

export function trackPageView(path: string) {
  ReactGA.send({ hitType: 'pageview', page: path });
}
```

---

## Backup et Recovery

### 1. Backup automatique (Supabase)

Supabase Pro+ offre des backups automatiques quotidiens.

Configuration dans Dashboard Supabase :
- Settings > Backups
- Daily backups activés
- Retention: 7 jours (Pro) ou 30 jours (Enterprise)

### 2. Backup manuel

```bash
# Dump de la base de données
pg_dump "postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres" > backup.sql

# Restaurer
psql "postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres" < backup.sql
```

### 3. Backup du code

- Push régulier sur GitHub
- Tags pour chaque release
- Branches de backup

```bash
# Créer un tag de release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

## Rollback

### En cas de problème

#### Frontend

```bash
# Revenir à la version précédente sur Vercel
vercel rollback

# Ou redéployer un commit spécifique
vercel --prod --yes
```

#### Edge Functions

```bash
# Redéployer une version antérieure
git checkout v1.0.0
supabase functions deploy
git checkout main
```

#### Database

```bash
# Restaurer depuis backup
supabase db reset --linked
```

---

## Checklist de déploiement

### Avant le déploiement

- [ ] Tous les tests passent (`npm run test:all`)
- [ ] Pas d'erreurs ESLint (`npm run lint`)
- [ ] Build réussit localement (`npm run build`)
- [ ] Variables d'environnement configurées
- [ ] Secrets Supabase configurés
- [ ] Migrations testées en staging
- [ ] RLS policies vérifiées
- [ ] Performance testée (Lighthouse > 90)

### Après le déploiement

- [ ] Vérifier l'accès à l'application
- [ ] Tester l'authentification
- [ ] Tester les fonctionnalités critiques
- [ ] Vérifier les Edge Functions
- [ ] Consulter les logs pour erreurs
- [ ] Vérifier les métriques de performance
- [ ] Tester sur mobile
- [ ] Vérifier le SSL/HTTPS

---

## Troubleshooting

### Problème: Edge Function timeout

**Solution:**
```bash
# Augmenter le timeout dans config.toml
[functions."my-function"]
timeout = 60  # secondes
```

### Problème: CORS errors

**Solution:**
```typescript
// Vérifier les headers CORS dans l'Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Problème: RLS bloque les requêtes

**Solution:**
```sql
-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Ajouter une policy si manquante
CREATE POLICY "Allow user access" ON your_table
  FOR ALL USING (auth.uid() = user_id);
```

### Problème: Build failed

**Solution:**
```bash
# Nettoyer et rebuilder
rm -rf node_modules dist
npm install
npm run build
```

---

## Support et ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Lovable Support](https://lovable.dev/support)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Actions Docs](https://docs.github.com/actions)

Pour toute question, consulter le canal #support sur le Discord du projet.
