

# Plan : Test E2E du flux Stripe (Checkout → Webhook → Profil)

## Problèmes critiques identifiés

### 1. Fonction webhook dupliquée avec config manquante
Il existe **deux** fonctions webhook Stripe :
- `stripe-webhook/` (ancienne) — a `verify_jwt = false` dans config.toml ✅
- `stripe-webhooks/` (nouvelle, créée récemment) — **manque** `verify_jwt = false` ❌

La nouvelle fonction ne peut pas recevoir les appels de Stripe car le JWT est vérifié par défaut. Stripe n'envoie pas de JWT.

### 2. Mapping produit incohérent entre fonctions
Les product IDs diffèrent entre les fonctions :

```text
stripe-config.ts (frontend) :
  standard → prod_TuImodwMnB71NS ✅ (nouveau)
  pro      → prod_TuImFSanPs0svj ✅ (nouveau)

stripe-webhooks/ (nouveau webhook) :
  standard → prod_T3RS5DA7XYPWBP ❌ (ancien)
  pro      → prod_T3RTReiXnCg9hy ❌ (ancien)

stripe-webhook/ (ancien webhook) :
  standard → prod_TuImodwMnB71NS ✅
  pro      → prod_TuImFSanPs0svj ✅

check-subscription/ :
  standard → prod_TuImodwMnB71NS ✅
  pro      → prod_TuImFSanPs0svj ✅
```

Le nouveau webhook `stripe-webhooks` utilise les **anciens** product IDs → le plan ne sera jamais correctement mappé après un paiement.

### 3. Deux webhooks actifs = confusion
Selon l'URL configurée dans Stripe Dashboard, un seul sera appelé. Il faut en garder un seul.

## Corrections à appliquer

### Étape 1 — Corriger `stripe-webhooks/index.ts`
Mettre à jour le mapping `PRODUCT_TO_PLAN` avec les bons product IDs :
```
prod_TuImodwMnB71NS → standard
prod_TuImFSanPs0svj → pro  
prod_T3RTMipVwUA7Ud → ultra_pro (déjà correct)
```

### Étape 2 — Ajouter `verify_jwt = false` dans config.toml
```toml
[functions.stripe-webhooks]
verify_jwt = false
```

### Étape 3 — Test automatisé via Edge Function
Appeler `check-subscription` pour vérifier que la chaîne fonctionne (auth → Stripe API → profil sync). Vérifier les logs.

### Étape 4 — Supprimer l'ancienne fonction `stripe-webhook`
Garder uniquement `stripe-webhooks` (la version avec idempotence, handlers structurés, et support `invoice.paid`).

## Résumé des prix Stripe confirmés

| Plan | Product ID | Price ID | Prix |
|------|-----------|----------|------|
| Standard | `prod_TuImodwMnB71NS` | `price_1SwUB8FdyZLEbAYasNL2RWyn` | 29€/mois |
| Pro | `prod_TuImFSanPs0svj` | `price_1SwUBEFdyZLEbAYaBInbPnb7` | 49€/mois |
| Ultra Pro | `prod_T3RTMipVwUA7Ud` | `price_1S7KaNFdyZLEbAYaovKWFgc4` | 99€/mois |

## Impact
Sans ces corrections, un utilisateur qui paie via checkout verra son webhook traité avec un mauvais mapping → le profil reste en `free` ou `standard` au lieu du plan acheté.

