# Guide de Migration Auth - Phase 2

## État actuel

L'application utilise un système d'authentification unifié avec les composants suivants :

### Fichiers principaux
- `src/contexts/UnifiedAuthContext.tsx` - Context principal avec gestion de session
- `src/contexts/AuthContext.tsx` - Wrapper de compatibilité (redirige vers UnifiedAuthContext)
- `src/hooks/useSessionManager.ts` - Gestion avancée des sessions
- `src/shared/hooks/useAuthOptimized.ts` - Hook optimisé avec cache de permissions

### Import recommandé (STANDARD)

```typescript
// ✅ RECOMMANDÉ - Import standard
import { useAuth } from '@/contexts/AuthContext';

// Ou directement depuis UnifiedAuth pour les nouvelles fonctionnalités
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
```

## Fonctionnalités Phase 2.2

### 1. Gestion de Session Expirée

```typescript
const { sessionInfo, refreshSession } = useAuth();

// Vérifier si la session expire bientôt
if (sessionInfo.expiresAt) {
  const timeLeft = sessionInfo.expiresAt.getTime() - Date.now();
  if (timeLeft < 5 * 60 * 1000) {
    // Moins de 5 minutes - proposer de rafraîchir
    await refreshSession();
  }
}

// Vérifier si la session est expirée
if (sessionInfo.isExpired) {
  // Rediriger vers login
}
```

### 2. Logging des Connexions Suspectes

Le système logge automatiquement :
- Toutes les connexions réussies (`user_login`)
- Toutes les déconnexions (`user_logout`)
- Les tentatives échouées (`failed_login_attempt`)
- L'activité suspecte après 3+ échecs (`suspicious_login_activity`)

Les logs sont stockés dans `activity_logs` avec :
- `user_agent` du navigateur
- Timestamp précis
- Sévérité (info/warn/error)

### 3. Actualisation Automatique du Token

Le token est automatiquement vérifié toutes les 60 secondes.
Quand l'utilisateur revient sur l'onglet (visibilitychange), une vérification est déclenchée.

## Migration Progressive

### Fichiers à migrer (246 fichiers)

Les fichiers importent actuellement depuis différentes sources :
- `@/contexts/AuthContext` (wrapper - OK)
- `@/contexts/UnifiedAuthContext` (direct - OK)
- `@/shared/hooks/useAuthOptimized` (optimisé - OK)

**Aucune migration urgente requise** car `AuthContext` redirige vers `UnifiedAuthContext`.

### Pour les nouvelles fonctionnalités

Si vous avez besoin de `sessionInfo` ou `refreshSession`, utilisez :

```typescript
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

const { sessionInfo, refreshSession } = useUnifiedAuth();
```

## Hooks Disponibles

| Hook | Usage |
|------|-------|
| `useAuth` | Usage standard (alias vers useUnifiedAuth) |
| `useUnifiedAuth` | Accès complet aux fonctionnalités Phase 2 |
| `useAuthOptimized` | Version optimisée avec cache de permissions |
| `useSessionManager` | Gestion avancée des sessions (standalone) |
| `useEnhancedAuth` | Rôles et permissions étendus |

## Checklist Sécurité

- ✅ Session expirée détectée avec notification
- ✅ Token refresh automatique
- ✅ Logging connexions dans `activity_logs`
- ✅ Détection activité suspecte (3+ échecs)
- ✅ Vérification admin via `has_role` RPC
- ✅ Roles stockés dans `user_roles` (pas dans profiles)
