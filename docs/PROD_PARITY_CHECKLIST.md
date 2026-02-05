# Production Parity Checklist

## Domaines et Environnements

| Domaine | Type | Redirect | Supabase Auth |
|---------|------|----------|---------------|
| `shopopti.io` | Production (canonical) | - | Site URL principal |
| `www.shopopti.io` | Production | 301 → shopopti.io | Redirect URL autorisée |
| `drop-craft-ai.lovable.app` | Staging | - | Redirect URL autorisée |

## Versioning

- [x] `APP_VERSION` affiché dans Settings > About
- [x] `GIT_SHA` affiché dans Settings > About
- [x] `BUILD_DATE` affiché dans Settings > About
- [x] Badge "STAGING" visible sur lovable.app
- [x] Footer avec version sur toutes les pages

## Configuration Supabase Auth

### Site URL
```
https://shopopti.io
```

### Redirect URLs autorisées
```
https://shopopti.io/*
https://www.shopopti.io/*
https://drop-craft-ai.lovable.app/*
http://localhost:5173/*
http://localhost:3000/*
```

## Variables d'Environnement

### Production (shopopti.io)
```env
VITE_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0
VITE_GIT_SHA=${GIT_SHA}
VITE_BUILD_DATE=${BUILD_DATE}
VITE_SUPABASE_URL=https://jsmwckzrmqecwwrswwrz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=https://shopopti.io
VITE_SITE_URL=https://shopopti.io
```

### Staging (drop-craft-ai.lovable.app)
```env
VITE_ENVIRONMENT=staging
VITE_APP_VERSION=1.0.0-staging
VITE_GIT_SHA=${GIT_SHA}
VITE_BUILD_DATE=${BUILD_DATE}
VITE_SUPABASE_URL=https://jsmwckzrmqecwwrswwrz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=https://drop-craft-ai.lovable.app
VITE_SITE_URL=https://drop-craft-ai.lovable.app
```

## Feature Flags

| Flag | Production | Staging |
|------|------------|---------|
| `USE_NEW_IMPORT_PIPELINE` | true | true |
| `ENABLE_BETA_FEATURES` | false | true |
| `DEBUG_MODE` | false | true |

## Vérification de Parité

### Comment vérifier

1. **Version identique sur prod:**
   ```bash
   # Sur shopopti.io
   curl -s https://shopopti.io | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+'
   
   # Sur www.shopopti.io (doit rediriger)
   curl -sI https://www.shopopti.io | grep -i location
   ```

2. **Version staging:**
   ```bash
   # Sur drop-craft-ai.lovable.app
   curl -s https://drop-craft-ai.lovable.app | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+'
   ```

3. **Vérifier dans l'UI:**
   - Aller dans Settings > About
   - Comparer APP_VERSION et GIT_SHA entre les domaines

### Critères de succès

- [ ] `shopopti.io` et `www.shopopti.io` ont le même `APP_VERSION`
- [ ] `www.shopopti.io` redirige 301 vers `shopopti.io`
- [ ] `drop-craft-ai.lovable.app` affiche badge "STAGING"
- [ ] Même `GIT_SHA` sur tous les domaines prod
- [ ] Auth fonctionne sur les 3 domaines

## Déploiement

### Build avec versioning
```bash
# Dans CI/CD ou manuellement
export VITE_APP_VERSION="1.0.0"
export VITE_GIT_SHA=$(git rev-parse HEAD)
export VITE_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

npm run build
```

### Vérifier le build
```bash
# Le fichier dist/index.html doit contenir la version
grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' dist/index.html
```
