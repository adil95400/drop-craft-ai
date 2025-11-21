# ⚠️ Fonctions Dépréciées

## Fonctions à supprimer dès que possible

Ces edge functions sont complètement mockées et n'apportent aucune valeur:

### 1. unified-payments/ ❌
**Date dépréciation**: 2025-01-21
**Raison**: Complètement mocké, pas d'intégration réelle
**Migration**: Utiliser Stripe directement ou créer fonction dédiée
**Impact**: AUCUN - Fonction non utilisée en production

### 2. unified-management/ ❌
**Date dépréciation**: 2025-01-21
**Raison**: Endpoints non pertinents, tout mocké
**Migration**: 
- SSO → Configurer dans Supabase Auth Dashboard
- Force-disconnect → Créer fonction admin dédiée
- Autres → Non nécessaires
**Impact**: AUCUN - Fonction non utilisée

### 3. unified-integrations/ ❌
**Date dépréciation**: 2025-01-21
**Raison**: Duplications avec autres fonctions + mocks
**Migration**: Utiliser fonctions dédiées:
- `aliexpress-integration/` pour AliExpress
- `bigbuy-integration/` pour BigBuy
- Créer `shopify-webhook/` pour Shopify
**Impact**: FAIBLE - Vérifier usages dans le code

## Fonctions candidates à dépréciation

### global-blog-optimizer/
**Raison**: Mock si pas de LOVABLE_API_KEY
**Action**: Implémenter ou supprimer

### canva-design-optimizer/
**Raison**: Mock complet
**Action**: Intégrer Canva API ou supprimer

### extension-processor/
**Raison**: Mocks Amazon/Shopify/Reviews
**Action**: Implémenter vraies extensions ou supprimer

## Processus de suppression

1. **Analyser les usages**
   ```bash
   grep -r "unified-payments\|unified-management\|unified-integrations" src/
   ```

2. **Créer alternatives** si nécessaire

3. **Supprimer la fonction**
   ```bash
   rm -rf supabase/functions/[function-name]/
   ```

4. **Nettoyer config.toml**
   Supprimer les entrées de configuration

5. **Tester** que rien n'est cassé

## Timeline

- **Immédiat**: Marquer comme dépréciées (✅ fait)
- **Semaine 1**: Vérifier usages + créer alternatives
- **Semaine 2**: Supprimer les fonctions
- **Semaine 3**: Cleanup final

## Impact Analysis

Avant de supprimer une fonction:
1. Chercher tous les appels dans le code
2. Vérifier les logs d'utilisation (Dashboard Supabase)
3. Créer des alternatives si nécessaire
4. Communiquer aux utilisateurs si fonction publique
