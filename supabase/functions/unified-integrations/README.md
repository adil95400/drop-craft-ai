# Unified Integrations - À REFACTORER

## ⚠️ STATUT: PARTIELLEMENT MOCKÉE

Cette fonction est un routeur pour différentes intégrations mais toutes les implémentations sont mockées.

## Endpoints actuels

1. **shopify** - Intégration Shopify (mocké)
2. **aliexpress** - AliExpress (mocké - existe déjà dans `aliexpress-integration`)
3. **bigbuy** - BigBuy (mocké - existe déjà dans `bigbuy-integration`)
4. **tracking** - Tracking (mocké)
5. **reviews** - Avis clients (mocké)
6. **marketplace** - Connecteur marketplace (mocké)

## Problèmes

### Duplication
- ❌ `aliexpress` existe déjà dans `aliexpress-integration/`
- ❌ `bigbuy` existe déjà dans `bigbuy-integration/`
- ❌ `shopify` devrait utiliser l'API Shopify native

### Architecture
Cette fonction "unified" n'apporte aucune valeur et crée de la confusion.
Chaque intégration devrait avoir sa propre edge function dédiée.

## Recommandations

### SUPPRIMER cette fonction et utiliser:

1. **Pour Shopify**: Utiliser webhooks Shopify natifs
   ```
   Configuration: Settings > Notifications > Webhooks dans Shopify Admin
   ```

2. **Pour AliExpress**: Utiliser `aliexpress-integration/`

3. **Pour BigBuy**: Utiliser `bigbuy-integration/`

4. **Pour Tracking**: Créer `shipment-tracking/`
   - Intégration 17track API
   - Ou AfterShip API
   - Structure ready-to-use

5. **Pour Reviews**: Créer `review-sync/`
   - Intégration Trustpilot, Google Reviews, etc.
   - Stockage dans table `product_reviews`

## Action immédiate

**SUPPRIMER** `unified-integrations/` et créer des fonctions dédiées:
```
supabase/functions/
├── shopify-webhook/      # Recevoir events Shopify
├── shipment-tracking/    # Tracking colis
├── review-sync/          # Sync avis clients
└── marketplace-connect/  # Connexion marketplaces
```

Chaque fonction = une responsabilité = plus facile à maintenir et tester.
