
# Plan de Correction des Scopes de Permission

## Problème Identifié

**Mismatch critique entre scopes legacy et granulaires :**

| Composant | Scopes Utilisés |
|-----------|-----------------|
| `extension-auth/index.ts` | `import`, `sync`, `logs`, `bulk` (legacy) |
| Gateway `types.ts` | `products:import`, `products:bulk`, `sync:read` (granulaires) |
| Tokens actifs (11) | `[import, sync, logs]` avec **0 scope_count** |
| Fonction SQL `generate_extension_token` | Attend scopes granulaires |

**Résultat :** Les tokens générés via `extension-auth` n'ont pas les permissions requises par le gateway → erreur `FORBIDDEN_SCOPE`.

---

## Solution en 3 Phases

### Phase 1 : Migration SQL des Tokens Existants

Créer une migration qui :

1. **Mappe les scopes legacy vers granulaires** :
   - `import` → `products:read`, `products:import`, `products:write`
   - `sync` → `sync:read`, `sync:trigger`
   - `logs` → `analytics:read`
   - `bulk` → `products:bulk`
   - `ai_optimize` → `ai:generate`, `ai:optimize`
   - `stock_monitor` → `sync:auto`

2. **Migre tous les tokens actifs** vers la table `extension_token_scopes`

3. **Met à jour le champ `permissions` JSONB** dans `extension_auth_tokens` pour utiliser le nouveau format

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX DE MIGRATION                            │
├─────────────────────────────────────────────────────────────────┤
│  extension_auth_tokens                                          │
│  permissions: ["import", "sync", "logs"]                        │
│                    │                                            │
│                    ▼                                            │
│  Fonction migrate_legacy_token_permissions()                    │
│                    │                                            │
│                    ▼                                            │
│  extension_token_scopes                                         │
│  (token_id, scope_id) pour products:read, products:import, etc. │
│                    │                                            │
│                    ▼                                            │
│  extension_auth_tokens.permissions mis à jour                   │
│  permissions: ["products:read", "products:import", ...]         │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2 : Mise à Jour de `extension-auth/index.ts`

Modifier l'edge function pour utiliser les scopes granulaires :

```typescript
// AVANT
const ALLOWED_PERMISSIONS = new Set([
  'import', 'sync', 'logs', 'bulk', 'ai_optimize', 'stock_monitor'
])

function validatePermissions(perms) {
  if (!Array.isArray(perms)) return ['import', 'sync']
  // ...
}

// APRÈS
const ALLOWED_PERMISSIONS = new Set([
  'products:read', 'products:write', 'products:import', 'products:bulk',
  'sync:read', 'sync:trigger', 'analytics:read', 'settings:read', 
  'ai:generate', 'ai:optimize'
])

const DEFAULT_PERMISSIONS = [
  'products:read', 'products:import', 'sync:read', 'settings:read', 'analytics:read'
]

function validatePermissions(perms) {
  if (!Array.isArray(perms)) return DEFAULT_PERMISSIONS
  // ...
}
```

### Phase 3 : Rétrocompatibilité dans le Gateway

Ajouter un mapper de compatibilité dans le gateway pour gérer les clients utilisant encore les anciens noms :

```typescript
const LEGACY_SCOPE_MAP: Record<string, string[]> = {
  'import': ['products:read', 'products:import'],
  'sync': ['sync:read', 'sync:trigger'],
  'logs': ['analytics:read'],
  'bulk': ['products:bulk'],
  'ai_optimize': ['ai:generate', 'ai:optimize'],
  'stock_monitor': ['sync:auto'],
}

function expandLegacyScopes(scopes: string[]): string[] {
  return scopes.flatMap(s => LEGACY_SCOPE_MAP[s] || [s])
}
```

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|-------------|
| `supabase/migrations/` | Nouvelle migration avec fonction de mapping et migration des tokens |
| `supabase/functions/extension-auth/index.ts` | `ALLOWED_PERMISSIONS` et `validatePermissions()` mis à jour |
| `supabase/functions/extension-gateway/actions/auth.ts` | Ajout du mapper legacy (optionnel pour rétrocompatibilité) |

---

## Détails Techniques

### Migration SQL

```sql
-- 1. Fonction de mapping legacy -> granulaire
CREATE OR REPLACE FUNCTION public.map_legacy_permission(legacy_perm TEXT)
RETURNS TEXT[]
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE legacy_perm
    WHEN 'import' THEN ARRAY['products:read', 'products:import', 'products:write']
    WHEN 'sync' THEN ARRAY['sync:read', 'sync:trigger']
    WHEN 'logs' THEN ARRAY['analytics:read']
    WHEN 'bulk' THEN ARRAY['products:bulk']
    WHEN 'ai_optimize' THEN ARRAY['ai:generate', 'ai:optimize']
    WHEN 'stock_monitor' THEN ARRAY['sync:auto']
    ELSE ARRAY[legacy_perm]::TEXT[]
  END;
$$;

-- 2. Fonction de migration pour un token
CREATE OR REPLACE FUNCTION public.migrate_token_to_granular_scopes(p_token_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_permissions JSONB;
  v_perm TEXT;
  v_granular_scopes TEXT[];
  v_scope_name TEXT;
  v_scope_id UUID;
  v_user_id UUID;
  v_granted INTEGER := 0;
BEGIN
  -- Récupérer les permissions legacy
  SELECT permissions, user_id INTO v_permissions, v_user_id
  FROM extension_auth_tokens WHERE id = p_token_id;
  
  -- Pour chaque permission legacy
  FOR v_perm IN SELECT jsonb_array_elements_text(COALESCE(v_permissions, '[]'::jsonb))
  LOOP
    -- Mapper vers scopes granulaires
    v_granular_scopes := map_legacy_permission(v_perm);
    
    -- Insérer chaque scope granulaire
    FOREACH v_scope_name IN ARRAY v_granular_scopes LOOP
      SELECT id INTO v_scope_id FROM extension_scopes WHERE scope_name = v_scope_name;
      
      IF v_scope_id IS NOT NULL THEN
        INSERT INTO extension_token_scopes (token_id, scope_id, granted_by)
        VALUES (p_token_id, v_scope_id, v_user_id)
        ON CONFLICT (token_id, scope_id) DO NOTHING;
        v_granted := v_granted + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Mettre à jour le champ permissions avec les scopes granulaires
  UPDATE extension_auth_tokens
  SET permissions = (
    SELECT to_jsonb(array_agg(DISTINCT s.scope_name))
    FROM extension_token_scopes ts
    JOIN extension_scopes s ON s.id = ts.scope_id
    WHERE ts.token_id = p_token_id
  )
  WHERE id = p_token_id;
  
  RETURN v_granted;
END;
$$;

-- 3. Migrer tous les tokens actifs
DO $$
DECLARE
  v_token RECORD;
  v_total INTEGER := 0;
BEGIN
  FOR v_token IN 
    SELECT id FROM extension_auth_tokens 
    WHERE is_active = true AND revoked_at IS NULL
  LOOP
    v_total := v_total + migrate_token_to_granular_scopes(v_token.id);
  END LOOP;
  
  RAISE NOTICE 'Migration terminée: % scopes attribués', v_total;
END;
$$;
```

### Mise à jour extension-auth

Changements dans `validatePermissions()` :

1. Remplacer `ALLOWED_PERMISSIONS` par les 19 scopes granulaires
2. Changer les permissions par défaut de `['import', 'sync']` vers `['products:read', 'products:import', 'sync:read', 'settings:read']`
3. Ajouter un mapper inline pour la rétrocompatibilité des clients existants

---

## Risques et Mitigations

| Risque | Mitigation |
|--------|------------|
| Extensions anciennes envoient encore `import` | Le mapper dans `validatePermissions()` convertit automatiquement |
| Tokens migrés perdent des permissions | La migration ajoute plus de scopes (inclusif), pas moins |
| Rollback nécessaire | Les anciennes permissions restent dans `permissions` JSONB jusqu'à mise à jour |

---

## Résultat Attendu

Après implémentation :
- Tous les tokens actifs auront des entrées dans `extension_token_scopes`
- Le gateway validera `products:import` avec succès
- Les nouvelles générations de tokens utiliseront directement le format granulaire
- Compatibilité maintenue avec les extensions < 5.8.1
