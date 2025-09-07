# Guide Complet d'Administration Système

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Accès et Authentification](#accès-et-authentification)
3. [Tableau de Bord Principal](#tableau-de-bord-principal)
4. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
5. [Sécurité et Audit](#sécurité-et-audit)
6. [Surveillance Système](#surveillance-système)
7. [Gestion des Données](#gestion-des-données)
8. [Optimisation des Performances](#optimisation-des-performances)
9. [Intégrations](#intégrations)
10. [Procédures d'Urgence](#procédures-durgence)
11. [Maintenance et Backup](#maintenance-et-backup)
12. [Dépannage](#dépannage)

---

## Vue d'ensemble

### Architecture du Système Admin

Le système d'administration est conçu avec une architecture sécurisée multi-niveaux :

- **Frontend** : Interface React avec authentification basée sur les rôles
- **Backend** : Supabase avec Row Level Security (RLS)
- **Sécurité** : Audit automatique et surveillance en temps réel
- **Monitoring** : Alertes automatiques et métriques de performance

### Niveaux d'Accès

1. **Super Admin** : Accès complet à toutes les fonctionnalités
2. **Admin** : Gestion des utilisateurs et données
3. **Manager** : Accès limité aux analytics et opérations
4. **User** : Accès standard aux fonctionnalités de base

---

## Accès et Authentification

### Connexion Admin

1. Accédez à `/admin` avec vos identifiants administrateur
2. Le système vérifie automatiquement vos permissions
3. Redirection automatique vers le tableau de bord admin

### Authentification à Deux Facteurs (2FA)

**Configuration :**
```bash
# Activer 2FA pour tous les admins
Paramètres > Sécurité > Authentification > Activer 2FA
```

**Codes de récupération :**
- Générez et sauvegardez vos codes de récupération
- Stockez-les dans un endroit sécurisé
- Utilisez-les uniquement en cas d'urgence

### Gestion des Sessions

- **Durée de session** : 8 heures par défaut
- **Session concurrente** : Maximum 3 sessions par admin
- **Déconnexion forcée** : Possible via le panel admin

---

## Tableau de Bord Principal

### Métriques Clés

Le tableau de bord affiche en temps réel :

1. **Utilisateurs** : Total, actifs, nouveaux inscriptions
2. **Commandes** : Volume, revenus, conversions
3. **Produits** : Catalogue, imports, performance
4. **Système** : Santé, performance, alertes

### Widgets Configurables

```typescript
// Configuration des widgets
const dashboardWidgets = {
  metrics: ['users', 'orders', 'revenue', 'products'],
  charts: ['user_growth', 'revenue_trend', 'product_performance'],
  alerts: ['security', 'performance', 'system_health']
}
```

### Alertes Temps Réel

Les alertes apparaissent automatiquement pour :
- Incidents de sécurité
- Pics de charge système
- Erreurs critiques
- Tentatives d'intrusion

---

## Gestion des Utilisateurs

### Vue d'ensemble des Utilisateurs

Accès via `Admin > Utilisateurs` :

- **Liste complète** : Tous les utilisateurs avec filtres
- **Recherche avancée** : Par email, nom, rôle, statut
- **Actions en masse** : Suspension, export, notifications

### Modification des Rôles

**Procédure sécurisée :**

1. Sélectionnez l'utilisateur
2. Choisissez le nouveau rôle
3. Confirmez avec justification
4. L'action est loggée automatiquement

```typescript
// Fonction de changement de rôle
const changeRole = async (userId: string, newRole: 'admin' | 'user') => {
  const result = await secureAdminService.changeUserRole(userId, newRole);
  // Logging automatique des changements
}
```

### Suspension et Bannissement

**Suspension temporaire :**
- Durée configurable (1 jour à 1 an)
- Raison obligatoire
- Notification automatique à l'utilisateur

**Bannissement permanent :**
- Suppression de toutes les données utilisateur
- Révocation de tous les tokens
- Ajout à la liste noire IP

### Surveillance des Activités

- **Connexions récentes** : IP, dispositif, localisation
- **Actions effectuées** : CRUD operations avec timestamps
- **Anomalies détectées** : Comportements suspects

---

## Sécurité et Audit

### Audit Automatique

Le système effectue des audits automatiques :

**Quotidien :**
- Vérification des politiques RLS
- Scan des permissions utilisateurs
- Contrôle des fonctions de base de données

**Hebdomadaire :**
- Audit complet de sécurité
- Révision des accès admin
- Vérification des intégrations

**Mensuel :**
- Rapport de sécurité complet
- Recommandations d'amélioration
- Mise à jour des politiques

### Événements de Sécurité

**Types d'événements surveillés :**

```typescript
const securityEvents = {
  authentication: ['failed_login', 'brute_force', 'token_theft'],
  authorization: ['privilege_escalation', 'unauthorized_access'],
  data: ['sensitive_data_access', 'data_export', 'mass_deletion'],
  system: ['configuration_change', 'admin_action', 'api_abuse']
}
```

### Journal d'Audit

**Accès :** `Admin > Sécurité > Journal d'Audit`

**Informations enregistrées :**
- Horodatage précis (UTC)
- Utilisateur et IP source
- Action effectuée
- Données modifiées
- Résultat de l'action

**Rétention :** 2 ans minimum, conforme RGPD

### Alertes de Sécurité

**Critiques (notification immédiate) :**
- Tentative d'accès admin non autorisé
- Modification des politiques de sécurité
- Export massif de données

**Élevées (notification sous 1h) :**
- Échecs de connexion répétés
- Accès depuis nouvelle géolocalisation
- Modifications de rôles utilisateurs

**Moyennes (rapport quotidien) :**
- Accès aux données sensibles
- Modifications de configuration
- Utilisation intensive de l'API

---

## Surveillance Système

### Métriques de Performance

**Tableau de bord :** `Admin > Monitoring`

**Métriques surveillées :**

1. **Base de données :**
   - Connexions actives
   - Temps de réponse des requêtes
   - Utilisation du stockage
   - Requêtes lentes

2. **API :**
   - Temps de réponse moyen
   - Taux d'erreur
   - Requêtes par seconde
   - Taux de limitation

3. **Système :**
   - Utilisation CPU
   - Mémoire disponible
   - Stockage
   - Bande passante

### Alertes de Performance

**Configuration des seuils :**

```typescript
const performanceThresholds = {
  database: {
    response_time: 500, // ms
    connections: 80,    // % max
    storage: 85        // % utilisé
  },
  api: {
    response_time: 200, // ms
    error_rate: 1,     // %
    rate_limit: 90     // % du quota
  }
}
```

### Santé du Système

**Indicateurs clés :**
- ✅ Opérationnel (vert)
- ⚠️ Dégradé (orange)
- ❌ Indisponible (rouge)

**Composants surveillés :**
- Authentification Supabase
- Base de données PostgreSQL
- Stockage de fichiers
- API Gateway
- CDN et cache

---

## Gestion des Données

### Backup Automatique

**Planification :**
- **Quotidien** : Données critiques (utilisateurs, commandes)
- **Hebdomadaire** : Base de données complète
- **Mensuel** : Archive complète avec fichiers

**Localisation des sauvegardes :**
- Stockage principal : Supabase
- Sauvegarde secondaire : AWS S3
- Archive froide : Glacier (6 mois+)

**Procédure de sauvegarde manuelle :**

1. Allez dans `Admin > Base de données`
2. Cliquez sur "Créer une sauvegarde"
3. Sélectionnez les tables à inclure
4. Ajoutez une description
5. Lancez la sauvegarde

### Restauration de Données

**Types de restauration :**

1. **Restauration ponctuelle** : Table spécifique à un moment donné
2. **Restauration complète** : Base de données entière
3. **Restauration sélective** : Données d'un utilisateur spécifique

**Procédure d'urgence :**

```bash
# Restauration d'urgence (terminal admin)
supabase db restore --backup-id <backup_id> --confirm
```

### Export de Données

**Formats supportés :**
- CSV : Données tabulaires
- JSON : Données complexes avec relations
- SQL : Dump complet de la base

**Conformité RGPD :**
- Export des données personnelles d'un utilisateur
- Anonymisation automatique
- Suppression sécurisée sur demande

---

## Optimisation des Performances

### Analyse des Performances

**Outils intégrés :**

1. **Analyseur de requêtes SQL :**
   - Identification des requêtes lentes
   - Suggestions d'optimisation
   - Analyse de l'utilisation des index

2. **Profiler d'API :**
   - Temps de réponse par endpoint
   - Goulots d'étranglement
   - Recommandations de cache

3. **Moniteur de ressources :**
   - Utilisation CPU/Mémoire
   - Métriques de base de données
   - Performance du CDN

### Optimisations Automatiques

**Cache intelligent :**
```typescript
const cacheStrategy = {
  user_profiles: '1h',
  product_catalog: '15min',
  order_data: '5min',
  analytics: '30min'
}
```

**Compression et optimisation :**
- Images : WebP automatique
- CSS/JS : Minification et gzip
- Database : Nettoyage automatique des sessions expirées

### Recommandations de Performance

Le système génère automatiquement des recommandations :

1. **Index manquants** : Ajout d'index sur colonnes fréquemment filtrées
2. **Requêtes N+1** : Détection et suggestions d'optimisation
3. **Cache inefficace** : Identification des données fréquemment requêtées
4. **Ressources inutilisées** : Nettoyage des données obsolètes

---

## Intégrations

### Gestion des Intégrations API

**Intégrations supportées :**

1. **E-commerce :**
   - Shopify
   - WooCommerce
   - Magento
   - PrestaShop

2. **CRM :**
   - HubSpot
   - Salesforce
   - Pipedrive

3. **Paiement :**
   - Stripe
   - PayPal
   - Square

4. **Analytics :**
   - Google Analytics
   - Facebook Pixel
   - Hotjar

### Configuration d'une Intégration

**Procédure standard :**

1. **Ajout :** `Admin > Intégrations > Ajouter`
2. **Configuration :** Clés API et paramètres
3. **Test de connexion :** Vérification automatique
4. **Synchronisation :** Configuration des données à synchroniser
5. **Monitoring :** Surveillance des erreurs et performances

**Exemple de configuration Shopify :**

```typescript
const shopifyConfig = {
  store_url: 'your-store.myshopify.com',
  api_key: 'your-api-key',
  api_secret: 'your-api-secret',
  access_token: 'your-access-token',
  sync_frequency: 'hourly',
  sync_products: true,
  sync_orders: true,
  sync_customers: false
}
```

### Monitoring des Intégrations

**Métriques surveillées :**
- Taux de succès des synchronisations
- Temps de réponse des API externes
- Volume de données synchronisées
- Erreurs et tentatives de retry

**Gestion des erreurs :**
- Retry automatique avec backoff exponentiel
- Notifications en cas d'échec répété
- Logs détaillés pour le debugging

---

## Procédures d'Urgence

### Mode Maintenance

**Activation du mode maintenance :**

1. Accédez à `Admin > Urgence`
2. Activez le mode maintenance
3. Personnalisez le message utilisateur
4. Définissez la durée estimée

**Pendant la maintenance :**
- Seuls les admins peuvent accéder au système
- Les utilisateurs voient une page de maintenance
- Les API renvoient un code 503
- Les tâches automatiques sont suspendues

### Arrêt d'Urgence

**Situations nécessitant un arrêt d'urgence :**
- Attaque de sécurité en cours
- Corruption de données détectée
- Surcharge système critique
- Incident de conformité

**Procédure :**

```bash
# Arrêt d'urgence complet
emergency_shutdown --reason "security_incident" --notify-users
```

**Checklist post-incident :**
- [ ] Identifier la cause racine
- [ ] Corriger le problème
- [ ] Tester la correction
- [ ] Redémarrer les services
- [ ] Vérifier la santé du système
- [ ] Communiquer aux utilisateurs

### Contact d'Urgence

**Équipe technique d'urgence :**
- Admin système : +33 X XX XX XX XX
- Sécurité : security@yourdomain.com
- Infrastructure : ops@yourdomain.com

**Procédure d'escalade :**
1. **Niveau 1** : Admin de garde (réponse sous 15min)
2. **Niveau 2** : Équipe technique (réponse sous 1h)
3. **Niveau 3** : Direction technique (réponse sous 4h)

---

## Maintenance et Backup

### Maintenance Préventive

**Planning mensuel :**

**Semaine 1 :**
- Mise à jour des dépendances
- Optimisation des performances
- Nettoyage des logs anciens

**Semaine 2 :**
- Audit de sécurité approfondi
- Test des procédures de backup
- Révision des politiques d'accès

**Semaine 3 :**
- Optimisation de base de données
- Mise à jour des intégrations
- Test de charge

**Semaine 4 :**
- Rapport mensuel complet
- Planification des améliorations
- Revue des incidents

### Stratégie de Backup

**Niveaux de backup :**

1. **Données critiques** (RPO: 1h, RTO: 15min)
   - Utilisateurs et authentification
   - Commandes et paiements
   - Configuration système

2. **Données importantes** (RPO: 24h, RTO: 2h)
   - Produits et catalogue
   - Analytics et rapports
   - Logs d'audit

3. **Données standard** (RPO: 7j, RTO: 24h)
   - Fichiers statiques
   - Archives anciennes
   - Données de test

**Test de restauration :**
- Hebdomadaire : Test de restauration partielle
- Mensuel : Test de restauration complète
- Trimestriel : Simulation de sinistre complet

---

## Dépannage

### Problèmes Courants

#### 1. Utilisateurs ne peuvent pas se connecter

**Diagnostic :**
```bash
# Vérifier l'état du service d'authentification
supabase status auth

# Consulter les logs de connexion
tail -f /var/log/auth.log
```

**Solutions :**
- Vérifier la configuration Supabase Auth
- Redémarrer le service d'authentification
- Vérifier les politiques RLS sur la table profiles

#### 2. Performance dégradée

**Diagnostic :**
```sql
-- Identifier les requêtes lentes
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

**Solutions :**
- Ajouter des index manquants
- Optimiser les requêtes N+1
- Activer la mise en cache

#### 3. Erreurs d'intégration

**Diagnostic :**
- Vérifier les logs d'intégration dans `Admin > Intégrations`
- Tester la connectivité API
- Vérifier les quotas et limitations

**Solutions :**
- Renouveler les tokens expirés
- Ajuster la fréquence de synchronisation
- Implémenter un retry avec backoff

### Logs et Debugging

**Emplacements des logs :**
```bash
# Logs application
/var/log/app/application.log

# Logs sécurité
/var/log/security/audit.log

# Logs base de données
/var/log/postgresql/postgresql.log

# Logs système
/var/log/syslog
```

**Analyse des logs :**
```bash
# Erreurs récentes
grep -i error /var/log/app/application.log | tail -20

# Tentatives de connexion suspectes
grep "failed login" /var/log/security/audit.log | head -10

# Performance base de données
grep "slow query" /var/log/postgresql/postgresql.log
```

### Support et Escalade

**Niveaux de support :**

1. **Auto-diagnostic** : Utiliser les outils intégrés
2. **Documentation** : Consulter ce guide et la FAQ
3. **Support Level 1** : Équipe technique interne
4. **Support Level 2** : Fournisseurs (Supabase, etc.)
5. **Support Level 3** : Consultants externes

**Informations à fournir :**
- Description détaillée du problème
- Étapes pour reproduire
- Logs d'erreur pertinents
- Impact utilisateurs
- Actions déjà tentées

---

## Annexes

### Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + Alt + D` | Tableau de bord admin |
| `Ctrl + Alt + U` | Gestion utilisateurs |
| `Ctrl + Alt + S` | Sécurité et audit |
| `Ctrl + Alt + M` | Monitoring système |
| `Ctrl + Alt + E` | Mode urgence |

### Variables d'Environnement

```bash
# Configuration admin
ADMIN_MAX_SESSIONS=3
ADMIN_SESSION_TIMEOUT=28800
ADMIN_2FA_REQUIRED=true

# Sécurité
SECURITY_AUDIT_FREQUENCY=daily
SECURITY_LOG_RETENTION=730
SECURITY_ALERT_EMAIL=admin@yourdomain.com

# Performance
PERFORMANCE_CACHE_TTL=3600
PERFORMANCE_QUERY_TIMEOUT=30000
PERFORMANCE_MAX_CONNECTIONS=100
```

### API Endpoints Admin

```bash
# Authentification admin
POST /api/admin/auth/login
POST /api/admin/auth/refresh
DELETE /api/admin/auth/logout

# Gestion utilisateurs
GET /api/admin/users
PUT /api/admin/users/:id/role
DELETE /api/admin/users/:id

# Sécurité
GET /api/admin/security/audit
POST /api/admin/security/scan
GET /api/admin/security/events

# Système
GET /api/admin/system/health
GET /api/admin/system/metrics
POST /api/admin/system/maintenance
```

---

## Changelog

### Version 1.0.0 (2024-01-XX)
- Version initiale du guide
- Couverture complète des fonctionnalités admin
- Procédures d'urgence et de maintenance

### Version 1.1.0 (À venir)
- Ajout des nouvelles intégrations
- Amélioration des procédures de backup
- Guide de migration et mise à jour

---

*Ce guide est maintenu par l'équipe technique. Pour toute suggestion ou correction, contactez tech@yourdomain.com*