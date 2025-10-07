# 🔒 Migration Sécurisée des Rôles Utilisateur

## ✅ MIGRATION COMPLÉTÉE

### Problème Critique Résolu
**Faille de sécurité majeure** : Les rôles étaient stockés dans la table `profiles` qui peut être modifiée par l'utilisateur, permettant une escalade de privilèges.

### Solution Implémentée

#### 1. Table `user_roles` Créée ✅
- Nouvelle table dédiée avec RLS strict
- Enum `app_role` ('admin', 'user')
- Contrainte unique `(user_id, role)`
- Foreign key vers `auth.users` avec CASCADE DELETE

#### 2. Fonctions Sécurisées Créées ✅
- **`has_role(_user_id, _role)`** : Vérifie si un utilisateur a un rôle spécifique (SECURITY DEFINER)
- **`get_user_primary_role(_user_id)`** : Récupère le rôle principal (SECURITY DEFINER)
- **`admin_set_role(target_user_id, new_role)`** : Change le rôle (admin only, avec logging)
- **`is_user_admin(check_user_id)`** : Vérifie si admin (mise à jour pour utiliser `has_role`)

#### 3. Politiques RLS Sécurisées ✅
```sql
✅ Admins peuvent voir tous les rôles
✅ Users peuvent voir leur propre rôle uniquement
✅ Seuls les admins peuvent modifier les rôles
✅ Logging automatique de tous les changements de rôles
```

#### 4. Migration des Données ✅
- Tous les rôles de `profiles.role` migrés vers `user_roles`
- Validation : seuls les users existants dans `auth.users` migrés
- Aucune perte de données

#### 5. Code Applicatif Mis à Jour ✅
- **`roleService.ts`** : Utilise maintenant `has_role()` et `admin_set_role()`
- **Erreurs TypeScript** : Corrigées dans `RealtimeAIAssistant.tsx` et `PWAService.ts`

---

## 🔐 Sécurité Renforcée

### Avant (VULNÉRABLE)
```typescript
// ❌ Les users pouvaient modifier leur propre rôle via profiles
UPDATE profiles SET role = 'admin' WHERE id = auth.uid()
```

### Après (SÉCURISÉ)
```typescript
// ✅ Seuls les admins peuvent changer les rôles via fonction sécurisée
SELECT admin_set_role(target_user_id, 'admin') -- Échec si non-admin
```

---

## 📊 Prochaines Étapes

### Actions Utilisateur Requises
1. **Activer "Leaked Password Protection"** dans Supabase Dashboard > Auth > Settings
2. **Mettre à jour Postgres** vers la dernière version (patches de sécurité)

### Phase 1B - Corrections Restantes
- [ ] Corriger 130 warnings RLS "Anonymous Access Policies"
- [ ] Sécuriser davantage le catalogue produits (anti-scraping)
- [ ] Ajouter rate limiting sur les fonctions critiques

### Phase 2 - Modules E-commerce
- [ ] Gestion avancée du stock
- [ ] Retours & remboursements
- [ ] Promotions & coupons

---

## 🎯 Impact

- **Sécurité** : Escalade de privilèges impossible
- **Audit** : Tous les changements de rôles loggés dans `security_events`
- **Performance** : Fonctions SECURITY DEFINER optimisées
- **Conformité** : Respect des meilleures pratiques Supabase

---

## 📝 Notes Techniques

### Fonction `has_role()`
```sql
-- SECURITY DEFINER = exécutée avec les privilèges du propriétaire
-- SET search_path = public = évite les attaques par injection
-- STABLE = optimise les plans de requêtes
```

### Logging Automatique
Tous les changements de rôles créent un événement dans `security_events` :
- Type : `role_change`
- Severité : `critical`
- Metadata : user_id, target_user_id, new_role, timestamp
