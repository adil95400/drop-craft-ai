# Guide de Déploiement Vercel - Drop Craft AI

## Vue d'ensemble

Ce guide détaille le déploiement complet de Drop Craft AI sur Vercel avec intégration Supabase.

## Prérequis

- Compte Vercel
- Compte Supabase
- Repository GitHub connecté
- Node.js 18+ installé localement

## Configuration des Variables d'Environnement

### 1. Variables Vercel

Dans le dashboard Vercel, configurez ces variables d'environnement :

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://dtozyrmmekdnvekissuh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=dtozyrmmekdnvekissuh

# Environment
NODE_ENV=production

# Optional: Analytics & Monitoring
VITE_SENTRY_DSN=your_sentry_dsn
VITE_GA_TRACKING_ID=GA_MEASUREMENT_ID
```

### 2. Secrets Supabase

Dans le dashboard Supabase > Project Settings > API, configurez :

```bash
# Edge Functions Secrets
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_...
SENDGRID_API_KEY=SG...
```

## Structure du Projet

```
drop-craft-ai/
├── public/
│   ├── _redirects          # Redirections Netlify/Vercel
│   └── robots.txt          # SEO
├── src/
│   ├── pages/              # Pages React
│   ├── components/         # Composants réutilisables
│   ├── integrations/       # Configuration Supabase
│   └── utils/              # Utilitaires
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Migrations DB
├── vercel.json             # Configuration Vercel
└── package.json
```

## Étapes de Déploiement

### 1. Préparation du Repository

```bash
# Cloner le projet
git clone https://github.com/your-username/drop-craft-ai.git
cd drop-craft-ai

# Installer les dépendances
npm install

# Tester localement
npm run dev
```

### 2. Configuration Vercel

#### Méthode 1: Dashboard Vercel

1. Connectez votre repository GitHub
2. Configurez les variables d'environnement
3. Déployez automatiquement

#### Méthode 2: Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déployer
vercel --prod

# Configurer les variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
```

### 3. Configuration Supabase

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité exemple
CREATE POLICY "Users can view their own products"
ON products FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
ON products FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 4. Déploiement des Edge Functions

```bash
# Installer Supabase CLI
npm install -g supabase

# Login Supabase
supabase login

# Link au projet
supabase link --project-ref dtozyrmmekdnvekissuh

# Déployer les functions
supabase functions deploy

# Configurer les secrets
supabase secrets set --env-file .env.production
```

## Configuration des Domaines

### 1. Domaine Custom

Dans Vercel Dashboard > Domains :

1. Ajouter votre domaine
2. Configurer les DNS records
3. Activer HTTPS automatique

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

### 2. Sous-domaines

```
api.dropcraft.ai → Supabase Edge Functions
admin.dropcraft.ai → Admin Panel
docs.dropcraft.ai → Documentation
```

## Optimisation des Performances

### 1. Build Configuration

```json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  },
  "functions": {
    "app/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 2. Cache Headers

```json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 3. Bundle Analysis

```bash
# Analyser la taille du bundle
npm run build
npm run analyze

# Optimiser les images
npm install -D @vercel/og
```

## Monitoring et Debugging

### 1. Vercel Analytics

```javascript
// src/lib/analytics.js
import { Analytics } from '@vercel/analytics/react'

export function VercelAnalytics() {
  return <Analytics />
}
```

### 2. Error Monitoring

```javascript
// src/utils/sentry.js
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### 3. Performance Monitoring

```javascript
// src/lib/performance.js
export function measureWebVitals(metric) {
  console.log(metric)
  
  // Envoyer vers analytics
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
  }
}
```

## Troubleshooting

### Problèmes Courants

#### 1. Build Fails

```bash
# Vérifier les logs
vercel logs your-deployment-url

# Tests locaux
npm run build
npm run preview
```

#### 2. Variables d'Environnement

```bash
# Lister les variables
vercel env ls

# Tester localement
vercel env pull .env.local
```

#### 3. Supabase Connection

```javascript
// Test connection
const testConnection = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('count')
    .single()
    
  console.log('Connection test:', { data, error })
}
```

#### 4. Edge Functions Errors

```bash
# Logs des functions
supabase functions logs --project-ref dtozyrmmekdnvekissuh

# Test local
supabase functions serve --env-file .env.local
```

## Scripts de Déploiement

### 1. Script Automatique

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Déploying Drop Craft AI to production..."

# Build check
npm run build

# Type check
npm run typecheck

# Deploy to Vercel
vercel --prod

# Deploy Supabase functions
supabase functions deploy --project-ref dtozyrmmekdnvekissuh

# Health check
curl -f https://your-domain.com/api/health || exit 1

echo "✅ Deployment successful!"
```

### 2. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Sécurité en Production

### 1. Headers de Sécurité

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 2. Rate Limiting

```javascript
// middleware.js
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function middleware(request) {
  const { success } = await ratelimit.limit(
    request.ip ?? 'anonymous'
  )
  
  if (!success) {
    return new Response('Rate limited', { status: 429 })
  }
}
```

## Maintenance

### 1. Updates Régulières

```bash
# Mettre à jour les dépendances
npm update

# Vérifier la sécurité
npm audit

# Déployer les mises à jour
npm run deploy
```

### 2. Monitoring Continu

- Vérifier les métriques Vercel
- Surveiller les logs Supabase
- Tester les fonctionnalités critiques
- Backup des données importantes

## Support

- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Documentation: https://docs.dropcraft.ai