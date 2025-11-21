# 🔄 Guide de Migration - Drop Craft AI

## Vue d'ensemble

Ce document guide les utilisateurs et développeurs à travers les migrations entre les différentes versions majeures de Drop Craft AI.

---

## 📋 Index des Migrations

- [Migration vers v2.0](#migration-vers-v20) - À venir Q2 2024
- [Migration vers v1.0](#migration-vers-v10) - Actuelle
- [Migration Architecture Modulaire](#migration-architecture-modulaire) - Complété

---

## 🎯 Migration Architecture Modulaire (v0.9 → v1.0)

### Date: Janvier 2024
### Statut: ✅ COMPLÉTÉ

### Changements Principaux

#### 1. Routing Modulaire

**Avant (App.tsx ~889 lignes):**
```typescript
// App.tsx - Monolithique
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* 100+ routes... */}
      </Routes>
    </Router>
  );
}
```

**Après (App.tsx ~70 lignes):**
```typescript
// App.tsx - Modulaire
import { publicRoutes } from './routes/public';
import { coreRoutes } from './routes/core';
import { productsRoutes } from './routes/products';
// ... autres modules

function App() {
  return (
    <Router>
      <Routes>
        {publicRoutes}
        {coreRoutes}
        {productsRoutes}
        {/* ... */}
      </Routes>
    </Router>
  );
}
```

#### 2. Nouvelle Structure de Routes

```
/ (public)
/dashboard/* (core)
/products/* (produits)
/analytics/* (analytics)
/automation/* (automation)
/marketing/* (marketing)
/integrations/* (intégrations)
/admin/* (administration)
```

#### 3. Hooks Optimisés

**Avant:**
- 276 hooks dupliqués
- Multiples `useAuth` dans 129 fichiers

**Après:**
```typescript
// src/shared/hooks/useAuthOptimized.ts
export const useAuthOptimized = () => {
  const { user, loading } = useAuth();
  const permissions = useMemo(() => 
    calculatePermissions(user), [user]
  );
  
  return { user, loading, permissions };
};
```

### Guide de Migration

#### Étape 1: Mise à jour du code

```bash
# Backup du projet
git checkout -b backup-pre-v1.0

# Pull les dernières changes
git pull origin main

# Installer les dépendances
npm install
```

#### Étape 2: Vérifier les imports

**Mettre à jour vos imports:**

```typescript
// ❌ Ancien
import { useAuth } from '@/hooks/useAuth';

// ✅ Nouveau
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
```

#### Étape 3: Tester votre application

```bash
# Lancer les tests
npm run test

# Lancer l'app en dev
npm run dev
```

### Redirections Legacy

Les anciennes URLs sont automatiquement redirigées:

```typescript
// Redirections automatiques
/catalog → /products/catalog
/crm/contacts → /marketing/crm/contacts
/settings → /dashboard/settings
```

### Breaking Changes

#### ⚠️ Changements qui cassent la compatibilité

1. **Hook `useAuth` déprécié**
   ```typescript
   // ❌ Ne fonctionne plus
   const { user } = useAuth();
   
   // ✅ Nouveau
   const { user } = useAuthOptimized();
   ```

2. **Routes catalogue changées**
   ```typescript
   // ❌ Ancienne route
   navigate('/catalog/products');
   
   // ✅ Nouvelle route
   navigate('/products/catalog');
   ```

3. **Imports de composants**
   ```typescript
   // ❌ Ancien
   import { Button } from '@/components/ui/button';
   
   // ✅ Nouveau (inchangé, mais précision)
   import { Button } from '@/components/ui/button';
   ```

### Bénéfices

- ✅ Bundle size optimisé (-40%)
- ✅ Maintenance simplifiée
- ✅ Lazy loading amélioré
- ✅ Performance +25%
- ✅ Timeout TypeScript résolu

---

## 🚀 Migration vers v1.0 (v0.9 → v1.0)

### Date: Janvier 2024
### Statut: ✅ COMPLÉTÉ

### Nouvelles Fonctionnalités

1. **Plans Tarifaires**
   - Free, Pro, Ultra Pro
   - Gestion des quotas automatique
   - Billing Stripe intégré

2. **IA Avancée**
   - Génération de contenu
   - Insights prédictifs
   - Optimisation automatique

3. **Mobile Ready**
   - PWA complet
   - Notifications push
   - Mode offline

### Migration de la Base de Données

#### Nouvelles Tables

```sql
-- Plans & Quotas
CREATE TABLE plan_limits (
  plan_name TEXT PRIMARY KEY,
  max_products INTEGER,
  max_orders_per_month INTEGER,
  max_integrations INTEGER,
  ai_tokens_per_month INTEGER
);

-- Analytics Insights
CREATE TABLE analytics_insights (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  insight_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ... voir migrations/
```

#### Exécuter les Migrations

```bash
# Backup de la BDD
npm run supabase:db:backup

# Exécuter les migrations
npm run supabase:migrate

# Vérifier
npm run supabase:db:check
```

### Migration des Données Utilisateur

#### Script de Migration

```typescript
// scripts/migrate-user-data.ts
import { supabase } from '@/integrations/supabase/client';

async function migrateUsers() {
  // 1. Migrer les profils
  const { data: users } = await supabase
    .from('profiles')
    .select('*');
  
  for (const user of users) {
    // Assigner plan par défaut
    await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_name: 'free',
        status: 'active'
      });
  }
  
  console.log('Migration complétée!');
}

migrateUsers();
```

```bash
# Exécuter le script
npm run migrate:users
```

### Migration des Intégrations

#### Shopify

**Avant v1.0:**
```typescript
const config = {
  shop: 'myshop.myshopify.com',
  accessToken: 'shpat_xxx'
};
```

**Après v1.0:**
```typescript
// Utiliser la nouvelle table integration_connections
await supabase
  .from('integration_connections')
  .insert({
    provider: 'shopify',
    credentials: {
      shop: 'myshop.myshopify.com',
      accessToken: 'shpat_xxx'
    },
    status: 'active'
  });
```

### Mise à Jour des Variables d'Environnement

```bash
# .env - Avant
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# .env - Après (ajouts)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx  # Nouveau
VITE_APP_VERSION=1.0.0              # Nouveau
```

### Checklist de Migration

- [ ] Backup du code et de la BDD
- [ ] Mise à jour vers latest main
- [ ] Installation des dépendances
- [ ] Exécution des migrations SQL
- [ ] Migration des données utilisateurs
- [ ] Mise à jour .env
- [ ] Tests de régression
- [ ] Tests E2E
- [ ] Déploiement staging
- [ ] Tests utilisateurs
- [ ] Déploiement production
- [ ] Monitoring post-déploiement

---

## 🔮 Migration vers v2.0 (Prévu Q2 2024)

### Changements Prévus

#### 1. Architecture Microservices

**Actuellement (Monolithe):**
```
Frontend (React) ↔ Supabase ↔ Edge Functions
```

**V2.0 (Microservices):**
```
Frontend → API Gateway → Services:
  - Auth Service
  - Product Service
  - Order Service
  - Analytics Service
  - AI Service
```

#### 2. GraphQL API

Migration de REST vers GraphQL:

```graphql
# Nouvelle API GraphQL
query GetProducts {
  products(filters: { category: "electronics" }) {
    id
    name
    price
    inventory {
      stock
      location
    }
  }
}
```

#### 3. Multi-Tenancy

Support entreprise avec isolation des données:

```sql
-- Nouvelle structure
CREATE SCHEMA tenant_123;
CREATE TABLE tenant_123.products (...);
```

### Guide de Préparation v2.0

#### Dès Maintenant

1. **Documenter vos customisations**
2. **Identifier les dépendances à l'API actuelle**
3. **Planifier les tests de migration**

#### Avant v2.0 Release

1. **Tester la version beta**
2. **Migrer en environnement staging**
3. **Former les équipes**

---

## 📚 Ressources de Migration

### Outils

```bash
# CLI de migration
npm install -g drop-craft-migration-tool

# Vérifier compatibilité
drop-craft check-compatibility

# Prévisualiser changements
drop-craft preview-migration --to=v2.0

# Exécuter migration
drop-craft migrate --to=v2.0
```

### Documentation

- [Guide d'upgrade Supabase](https://supabase.com/docs/guides/migrations)
- [Breaking Changes Log](./CHANGELOG.md)
- [API Deprecation Schedule](./API.md#deprecations)

### Support

- 💬 Discord: [#migration-help](https://discord.gg/dropcraft)
- 📧 Email: migrations@drop-craft-ai.com
- 📞 Support Premium: +33 1 XX XX XX XX

---

## ⚠️ Rollback Procedure

Si la migration échoue, voici comment revenir en arrière:

### Rollback Code

```bash
# Retour à la version précédente
git checkout backup-pre-v1.0
npm install
npm run dev
```

### Rollback Database

```bash
# Restaurer le backup
psql -U postgres -d drop_craft_ai < backup_pre_migration.sql

# Ou via Supabase Dashboard
# Settings → Database → Backups → Restore
```

### Rollback Complet

```bash
# Script automatisé
npm run rollback --to=v0.9
```

---

## 📊 Matrice de Compatibilité

| Version | Node.js | React | Supabase | Stripe API |
|---------|---------|-------|----------|------------|
| v0.9 | 16+ | 18.2 | 2.38 | 2023-10-16 |
| v1.0 | 18+ | 18.3 | 2.45+ | 2024-01-01 |
| v2.0 (prévu) | 20+ | 19.0 | 3.0+ | 2024-06-01 |

---

## ✅ Post-Migration Checklist

Après chaque migration, vérifier:

- [ ] Application démarre sans erreurs
- [ ] Authentification fonctionne
- [ ] Base de données accessible
- [ ] Intégrations tierces OK
- [ ] Paiements fonctionnels
- [ ] Analytics collectées
- [ ] Emails envoyés
- [ ] Mobile app sync
- [ ] Performance stable
- [ ] Monitoring actif
- [ ] Backups configurés

---

## 📞 Besoin d'Aide ?

**Migration complexe ?** Notre équipe peut vous aider:
- 🎯 Migration assistée (Pro/Ultra Pro)
- 🚀 Migration white-glove (Enterprise)
- 📚 Sessions de formation

**Contact**: migrations@drop-craft-ai.com

---

**Dernière mise à jour**: 2024-01-XX  
**Prochaine révision**: Avant chaque release majeure
