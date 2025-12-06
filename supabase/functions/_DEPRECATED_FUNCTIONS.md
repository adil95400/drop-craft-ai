# ✅ Fonctions Nettoyées

Ce document documente les fonctions obsolètes qui ont été supprimées.

## Fonctions Supprimées

### 1. unified-payments/ ✅ SUPPRIMÉ
**Date suppression**: 2025-01-21
**Raison**: Complètement mocké, pas d'intégration réelle
**Migration**: Utiliser Stripe directement via `stripe-checkout` et `stripe-webhook`

### 2. unified-management/ ✅ SUPPRIMÉ
**Date suppression**: 2025-01-21
**Raison**: Endpoints non pertinents, tout mocké
**Migration**: 
- SSO → Configurer dans Supabase Auth Dashboard
- Force-disconnect → Fonction `force-disconnect-user`

### 3. unified-integrations/ ✅ SUPPRIMÉ
**Date suppression**: 2025-01-21
**Raison**: Duplications avec autres fonctions + mocks
**Migration**: Utiliser fonctions dédiées:
- `aliexpress-integration/` pour AliExpress
- `bigbuy-integration/` pour BigBuy
- `shopify-webhook/` pour Shopify

### 4. canva-design-optimizer/ ✅ SUPPRIMÉ
**Date suppression**: 2025-12-06
**Raison**: Mock complet sans intégration Canva API réelle
**Migration**: Utiliser l'intégration Canva native via `canva-oauth` et `canva-webhook`

## Fonctions Conservées avec Notes

### global-blog-optimizer/ ✅ CONSERVÉ
**Statut**: Production-ready avec LOVABLE_API_KEY
**Notes**: Génère des articles de blog via Lovable AI. Fonctionne correctement quand la clé API est configurée.

### extension-processor/ ✅ CONSERVÉ
**Statut**: En développement
**Notes**: Intégration des extensions Chrome. À compléter avec vraies APIs Amazon/Shopify.

## Historique de Nettoyage

| Date | Action | Fonction | Impact |
|------|--------|----------|--------|
| 2025-01-21 | Marqué déprécié | unified-payments, unified-management, unified-integrations | Aucun |
| 2025-01-21 | Supprimé | unified-payments, unified-management, unified-integrations | Aucun |
| 2025-12-06 | Supprimé | canva-design-optimizer | Aucun - fonction mock |

## Process de Dépréciation Future

1. **Identifier** la fonction candidate via audit
2. **Vérifier** les usages dans le code (`grep -r "function-name" src/`)
3. **Créer** alternatives si nécessaire
4. **Supprimer** la fonction du dossier `supabase/functions/`
5. **Nettoyer** l'entrée dans `config.toml`
6. **Documenter** dans ce fichier
