# Unified Management - À REFACTORER OU SUPPRIMER

## ⚠️ STATUT: FONCTION MOCKÉE - NON FONCTIONNELLE

Cette edge function est complètement mockée et ne fait rien de fonctionnel.

## Endpoints actuels (tous mockés)

1. **cli-manager** - Gestion CLI (non implémenté)
2. **sso-manager** - SSO management (non implémenté)
3. **force-disconnect** - Déconnexion forcée (non implémenté)
4. **secure-credentials** - Gestion credentials (non implémenté)

## Recommandations

### À SUPPRIMER:
- ❌ `cli-manager` - Les opérations CLI ne devraient pas être exposées via API web
- ❌ `sso-manager` - Le SSO doit être configuré dans Supabase Auth directement
- ❌ `secure-credentials` - Les credentials doivent utiliser Supabase Vault

### À IMPLÉMENTER CORRECTEMENT:
- ✅ `force-disconnect` - Peut être utile pour admin

#### Implémentation force-disconnect réelle:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function handleForceDisconnect(body: any) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { userId, reason } = body
  
  if (!userId) {
    throw new Error('userId required')
  }
  
  // Révoquer toutes les sessions de l'utilisateur
  const { error } = await supabase.auth.admin.signOut(userId, 'global')
  
  if (error) throw error
  
  // Logger l'action admin
  await supabase
    .from('audit_trail')
    .insert({
      action: 'force_disconnect',
      entity_type: 'user',
      entity_id: userId,
      metadata: { reason },
      severity: 'high'
    })
  
  return {
    success: true,
    message: 'User disconnected',
    data: { userId, reason, timestamp: new Date().toISOString() }
  }
}
```

## Action recommandée

**SUPPRIMER** cette fonction unifiée et créer des fonctions spécifiques si besoin:
- `admin-disconnect/` pour déconnexion forcée
- Configurer SSO dans Supabase Dashboard
- Utiliser Supabase Vault pour secrets
