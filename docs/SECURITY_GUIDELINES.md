# 🔒 Guide de Sécurité - DropCraft AI

## Vue d'ensemble de la sécurité

Ce document présente les pratiques de sécurité implémentées dans DropCraft AI et les recommandations pour maintenir un niveau de sécurité optimal.

---

## 🛡️ Architecture de Sécurité

### Niveaux de Protection

```
┌─────────────────────────────────────────┐
│  Niveau 1: Authentification (Supabase)  │
│  ✅ JWT tokens, RLS policies            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Niveau 2: Autorisation (RLS + Roles)   │
│  ✅ Role-based access control           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Niveau 3: Validation des Données       │
│  ✅ Zod schemas, input sanitization     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Niveau 4: Audit & Monitoring           │
│  ✅ Security events, activity logs      │
└─────────────────────────────────────────┘
```

---

## 🔐 Authentification

### Méthodes Supportées
- ✅ Email/Password (avec vérification email)
- ✅ Magic Links
- ✅ Google OAuth
- ✅ Extension tokens (pour Chrome extension)

### Bonnes Pratiques
```typescript
// ✅ CORRECT: Toujours vérifier l'auth avant les opérations sensibles
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Unauthorized')

// ✅ CORRECT: Utiliser les tokens JWT pour les API calls
const token = (await supabase.auth.getSession()).data.session?.access_token
```

---

## 🎯 Row Level Security (RLS)

### Politiques RLS par Type de Table

#### 1. Tables Privées (User-Specific)
```sql
-- ✅ CORRECT: Accès strictement limité à l'utilisateur
CREATE POLICY "Users access own data"
ON table_name
FOR ALL
USING (auth.uid() = user_id);
```

**Tables concernées**:
- `orders`, `customers`, `suppliers`
- `import_jobs`, `automation_workflows`
- `api_keys`, `api_logs`

#### 2. Tables Publiques (Lecture Seule)
```sql
-- ✅ ACCEPTABLE: Lecture publique pour contenu éducatif
CREATE POLICY "Public read access"
ON academy_courses
FOR SELECT
USING (is_published = true);

-- ✅ SÉCURISÉ: Écriture authentifiée uniquement
CREATE POLICY "Authenticated write"
ON academy_comments
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

**Tables concernées**:
- `academy_courses`, `academy_lessons`
- `video_tutorials`, `help_articles`
- `catalog_products` (vue publique)

#### 3. Tables Admin
```sql
-- ✅ CORRECT: Accès admin uniquement
CREATE POLICY "Admin only access"
ON security_events
FOR ALL
USING (public.is_admin(auth.uid()));
```

**Tables concernées**:
- `security_events`, `audit_trail`
- `system_metrics`, `feature_flags`

---

## 🔒 Fonction Database Sécurisées

### Checklist de Sécurité pour Fonctions

#### ✅ Toutes les fonctions DOIVENT avoir:
1. **SET search_path = 'public'** - Prévient l'injection SQL
2. **SECURITY DEFINER** (si besoin d'accès élevé) - Limite les privilèges
3. **Validation des entrées** - Vérifier tous les paramètres
4. **Logging** - Tracer les accès sensibles

#### Exemple de Fonction Sécurisée:
```sql
CREATE OR REPLACE FUNCTION public.get_user_data(target_user_id uuid)
RETURNS TABLE(...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- ⚠️ CRITIQUE
AS $$
BEGIN
  -- 1. Vérifier l'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- 2. Vérifier l'autorisation
  IF target_user_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- 3. Logger l'accès
  INSERT INTO security_events (
    user_id, event_type, severity, description
  ) VALUES (
    auth.uid(), 'data_access', 'info', 'User accessed data'
  );
  
  -- 4. Retourner les données
  RETURN QUERY SELECT ... FROM ...;
END;
$$;
```

---

## 📊 Monitoring de Sécurité

### Tables de Logging

#### 1. Security Events (`security_events`)
```sql
-- Événements de sécurité critiques
INSERT INTO security_events (
  user_id,
  event_type,        -- 'login', 'role_change', 'data_access', etc.
  severity,          -- 'info', 'warning', 'critical'
  description,
  metadata
) VALUES (...);
```

**Événements tracés**:
- Changements de rôles
- Accès aux données sensibles
- Tentatives de scraping
- Échecs d'authentification
- Modifications de configuration

#### 2. Activity Logs (`activity_logs`)
```sql
-- Actions utilisateur normales
INSERT INTO activity_logs (
  user_id,
  action,           -- 'create', 'update', 'delete', etc.
  entity_type,      -- 'product', 'order', 'supplier', etc.
  entity_id,
  metadata
) VALUES (...);
```

#### 3. Audit Trail (`audit_trail`)
```sql
-- Audit complet avec before/after
INSERT INTO audit_trail (
  user_id,
  entity_type,
  action,
  before_data,      -- État avant modification
  after_data,       -- État après modification
  ip_address,
  user_agent
) VALUES (...);
```

### Requêtes de Monitoring

#### Détecter les activités suspectes
```sql
-- Utilisateurs avec beaucoup d'erreurs
SELECT user_id, COUNT(*) as error_count
FROM security_events
WHERE severity = 'critical'
  AND created_at > now() - interval '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 10;

-- Tentatives de scraping
SELECT user_id, ip_address, access_count
FROM catalog_access_log
WHERE is_suspicious = true
  AND blocked_until > now();

-- Accès admin récents
SELECT user_id, event_type, description, created_at
FROM security_events
WHERE event_type IN ('role_change', 'admin_catalog_intelligence_access')
ORDER BY created_at DESC
LIMIT 50;
```

---

## 🚨 Rate Limiting & Anti-Scraping

### Protection du Catalogue

#### Détection Automatique
La fonction `detect_catalog_scraping()` monitore:
- ✅ >50 requêtes en 5 minutes = blocage automatique
- ✅ Blocage temporaire de 1 heure
- ✅ Logging dans `security_events`

#### Configuration
```sql
-- Table de tracking
CREATE TABLE catalog_access_log (
  user_id uuid,
  ip_address text,
  access_count integer DEFAULT 1,
  last_access_at timestamptz DEFAULT now(),
  is_suspicious boolean DEFAULT false,
  blocked_until timestamptz
);
```

### Rate Limiting API

#### Par Clé API
```sql
-- Vérifier le rate limit avant chaque requête
SELECT public.check_api_rate_limit(
  api_key_id,
  1000,  -- limite: 1000 requêtes
  60     -- fenêtre: 60 minutes
);
```

#### Configuration par Plan
- **Free**: 100 req/heure
- **Pro**: 1000 req/heure
- **Ultra**: 10000 req/heure
- **Enterprise**: Illimité

---

## 🔑 Gestion des Secrets

### Secrets Supabase
```bash
# Variables d'environnement sécurisées
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ CRITIQUE: Jamais côté client!
```

### API Keys Externes
Stockées de manière chiffrée dans:
- `encrypted_credentials` (suppliers)
- `access_token` (marketplace_integrations)
- Supabase secrets (edge functions)

### ⚠️ NE JAMAIS:
- Commiter des secrets dans Git
- Logger des secrets (passwords, tokens, keys)
- Envoyer des secrets côté client
- Stocker des secrets en clair

---

## 🎭 Contrôle d'Accès par Rôle

### Hiérarchie des Rôles

```
┌──────────┐
│  Admin   │ ← Accès complet
└──────────┘
     ↓
┌──────────┐
│   User   │ ← Accès standard
└──────────┘
     ↓
┌──────────┐
│   Anon   │ ← Lecture publique uniquement
└──────────┘
```

### Vérification des Rôles

```typescript
// ✅ Frontend: Vérifier le rôle
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile.role !== 'admin') {
  // Rediriger ou afficher erreur
}
```

```sql
-- ✅ Backend: Utiliser les fonctions de vérification
SELECT public.is_admin(auth.uid());
SELECT public.has_role(auth.uid(), 'admin');
SELECT public.get_user_role(auth.uid());
```

### Changement de Rôle Sécurisé

```sql
-- ✅ Seulement via fonction admin sécurisée
SELECT public.admin_set_role(
  'target-user-id'::uuid,
  'admin'::app_role
);

-- Protections automatiques:
-- ❌ Empêche de changer son propre rôle
-- ❌ Nécessite le rôle admin
-- ✅ Logge dans security_events
```

---

## 📝 Validation des Données

### Frontend (Zod)
```typescript
import { z } from 'zod'

// ✅ CORRECT: Valider toutes les entrées utilisateur
const productSchema = z.object({
  name: z.string().min(3).max(200),
  price: z.number().positive().max(999999),
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  email: z.string().email()
})

// Utiliser avant l'envoi
const validated = productSchema.parse(formData)
```

### Backend (Edge Functions)
```typescript
// ✅ CORRECT: Valider dans les edge functions
const { name, price } = await req.json()

if (!name || typeof name !== 'string') {
  return new Response(
    JSON.stringify({ error: 'Invalid name' }),
    { status: 400, headers: corsHeaders }
  )
}

if (!price || typeof price !== 'number' || price <= 0) {
  return new Response(
    JSON.stringify({ error: 'Invalid price' }),
    { status: 400, headers: corsHeaders }
  )
}
```

### Sanitization
```typescript
import DOMPurify from 'dompurify'

// ✅ CORRECT: Nettoyer le HTML avant affichage
const cleanHTML = DOMPurify.sanitize(userInput)

// ✅ CORRECT: Échapper les caractères SQL (via parameterized queries)
const { data } = await supabase
  .from('products')
  .select()
  .ilike('name', `%${searchTerm}%`)  // Supabase gère l'échappement
```

---

## 🔍 Tests de Sécurité

### Tests Automatisés

#### 1. Test d'Injection SQL
```typescript
// tests/security/sql-injection.spec.ts
test('prevents SQL injection in search', async ({ request }) => {
  const maliciousInput = "'; DROP TABLE users; --"
  
  const response = await request.get(
    `/api/search?q=${encodeURIComponent(maliciousInput)}`
  )
  
  expect(response.status()).not.toBe(500)
  expect(response.ok()).toBeTruthy()
})
```

#### 2. Test d'Autorisation
```typescript
// tests/security/authorization.spec.ts
test('prevents unauthorized data access', async ({ request }) => {
  const response = await request.get('/api/admin/users', {
    headers: {
      'Authorization': 'Bearer fake-token'
    }
  })
  
  expect(response.status()).toBe(401)
})
```

#### 3. Test de Rate Limiting
```typescript
// tests/security/rate-limit.spec.ts
test('enforces rate limiting', async ({ request }) => {
  const promises = []
  for (let i = 0; i < 100; i++) {
    promises.push(request.get('/api/catalog'))
  }
  
  const responses = await Promise.all(promises)
  const rateLimited = responses.some(r => r.status() === 429)
  
  expect(rateLimited).toBeTruthy()
})
```

### Checklist Manuelle

- [ ] Tester l'authentification avec différents rôles
- [ ] Vérifier que les données sensibles ne sont pas exposées
- [ ] Tester les edge cases des formulaires
- [ ] Vérifier les logs de sécurité
- [ ] Tester le comportement avec des données malveillantes

---

## 📋 Avertissements de Sécurité Acceptables

### Extensions dans Public Schema (2 warnings)

**Status**: ⚠️ Acceptable  
**Raison**: Extensions PostgreSQL nécessaires pour les fonctionnalités

Extensions:
- `pg_trgm`: Recherche full-text performante
- `uuid-ossp`: Génération d'UUIDs

**Impact**: Faible (accès lecture seule aux fonctions)

### Politiques RLS Anonymes (>240 warnings)

**Status**: ✅ Intentionnel  
**Raison**: Contenu public accessible sans authentification

Tables avec accès anonyme **justifié**:
- ✅ `academy_courses` - Cours publics consultables
- ✅ `academy_lessons` - Leçons publiques
- ✅ `video_tutorials` - Tutoriels publics
- ✅ `help_articles` - Articles d'aide publics
- ✅ `catalog_products` (vue limitée) - Catalogue produits

**Protection appliquée**:
- Écriture: Authentification requise
- Lecture: Données sensibles masquées
- Rate limiting: Anti-scraping actif
- Logging: Tous les accès tracés

Tables avec accès anonyme à **restreindre**:
- 🟠 `ab_test_experiments` - Tests A/B (sensibles)
- 🟠 `ab_test_variants` - Variantes de tests
- 🟠 `cron.job` - Jobs système

---

## 🚀 Déploiement Sécurisé

### Checklist Pré-Production

#### Configuration
- [ ] Variables d'environnement configurées
- [ ] Secrets Supabase en place
- [ ] CORS configuré correctement
- [ ] Rate limiting activé

#### Base de Données
- [ ] RLS activé sur toutes les tables
- [ ] Toutes les fonctions ont `SET search_path`
- [ ] Indexes créés pour performance
- [ ] Backup automatiques configurés

#### Application
- [ ] Build de production testé
- [ ] Tests automatisés passés
- [ ] Pas de console.log en production
- [ ] Error tracking activé (Sentry)

#### Monitoring
- [ ] Alertes configurées
- [ ] Logs de sécurité actifs
- [ ] Dashboard de monitoring accessible

---

## 🔧 Maintenance

### Tâches Régulières

#### Quotidien
- Vérifier les alertes de sécurité
- Monitorer les tentatives d'accès suspects
- Vérifier les logs d'erreurs

#### Hebdomadaire
- Audit des nouveaux utilisateurs
- Vérification des rate limits
- Revue des logs de sécurité

#### Mensuel
- Audit complet de sécurité
- Mise à jour des dépendances
- Revue des politiques RLS
- Tests de pénétration

### Commandes Utiles

```sql
-- Vérifier les fonctions sans search_path
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_proc_config
    WHERE oid = p.oid AND setconfig::text LIKE '%search_path%'
  );

-- Trouver les tables sans RLS
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies
  );

-- Lister les accès suspects récents
SELECT * FROM security_events
WHERE severity IN ('warning', 'critical')
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

---

## 📚 Ressources

### Documentation Officielle
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Outils
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk Security Scanner](https://snyk.io/)

### Contact Support
- 📧 Email: security@dropcraft.ai
- 🔗 Discord: [Lovable Community](https://discord.com/channels/lovable)

---

## ⚡ Actions Rapides

### En Cas d'Incident

1. **Désactiver le compte compromis**
```sql
UPDATE profiles SET is_active = false WHERE id = 'user-id';
```

2. **Révoquer les tokens**
```sql
INSERT INTO revoked_tokens (token_hash, expires_at)
VALUES (encode(digest('token', 'sha256'), 'hex'), now() + interval '1 year');
```

3. **Investiguer**
```sql
SELECT * FROM security_events
WHERE user_id = 'compromised-user-id'
ORDER BY created_at DESC;
```

4. **Notifier**
- Alerter l'équipe via Slack/Email
- Logger l'incident dans `security_events`
- Documenter dans le rapport d'incident

---

**Dernière mise à jour**: 23 Novembre 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
