# 🎉 Configuration Stripe - ShopOpti+

## ✅ Implémentation Complète

Votre système de paiement Stripe est entièrement fonctionnel avec :

### 🚀 Fonctionnalités Implémentées

1. **Edge Functions Stripe** ✅
   - `check-subscription` - Vérification du statut d'abonnement
   - `create-checkout` - Création de sessions de paiement
   - `stripe-webhook` - Synchronisation automatique des webhooks
   - `stripe-portal` - Accès au portail client Stripe
   - `get-invoices` - Récupération de l'historique des factures

2. **Synchronisation Automatique** ✅
   - Mise à jour automatique du plan dans la table `profiles`
   - Synchronisation via webhooks Stripe
   - Vérification du plan au login

3. **Interface Utilisateur** ✅
   - Page de tarification avec 3 plans (Standard, Pro, Ultra Pro)
   - Gestion d'abonnement complète
   - Historique des paiements
   - Pages de confirmation (succès/annulation)

4. **Sécurité & Gestion des Erreurs** ✅
   - Authentification sécurisée
   - Gestion des erreurs de paiement
   - Rate limiting
   - Logs détaillés

---

## 📋 Configuration Requise

### 1. Configuration du Webhook Stripe

**URL du Webhook :**
```
https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/stripe-webhook
```

**Événements à sélectionner dans Stripe Dashboard :**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

**Étapes :**
1. Connectez-vous à https://dashboard.stripe.com/webhooks
2. Cliquez sur "Add endpoint"
3. Collez l'URL ci-dessus
4. Sélectionnez les événements listés
5. Copiez le "Signing secret" (commence par `whsec_...`)
6. Ajoutez-le dans Supabase Secrets sous le nom `STRIPE_WEBHOOK_SECRET`

### 2. Activation du Customer Portal

Le Customer Portal permet aux utilisateurs de gérer leur abonnement (annulation, changement de plan, mise à jour des moyens de paiement).

**Étapes :**
1. Allez sur https://dashboard.stripe.com/settings/billing/portal
2. Activez le Customer Portal
3. Configurez les actions autorisées :
   - ✅ Annulation d'abonnement
   - ✅ Changement de plan
   - ✅ Mise à jour des moyens de paiement
   - ✅ Accès aux factures

### 3. Configuration des Produits et Prix

**Produits existants :**

| Plan | Product ID | Price ID | Prix |
|------|-----------|----------|------|
| Standard | `prod_T3RS5DA7XYPWBP` | `price_1S7KZaFdyZLEbAYa8kA9hCUb` | 19€/mois |
| Pro | `prod_T3RTReiXnCg9hy` | `price_1S7Ka5FdyZLEbAYaszKu4XDM` | 29€/mois |
| Ultra Pro | `prod_T3RTMipVwUA7Ud` | `price_1S7KaNFdyZLEbAYaovKWFgc4` | 99€/mois |

**Ces IDs sont déjà configurés dans le code et fonctionnent avec vos produits Stripe.**

---

## 🧪 Test de l'Intégration

### Mode Test (Recommandé d'abord)

1. **Carte de test :**
   ```
   Numéro: 4242 4242 4242 4242
   Date: N'importe quelle date future
   CVC: N'importe quel 3 chiffres
   ```

2. **Flux de test complet :**
   - Allez sur `/pricing`
   - Cliquez sur "Passer à Pro"
   - Utilisez la carte de test
   - Vérifiez la redirection vers `/payment/success`
   - Confirmez la mise à jour du plan dans le tableau de bord

### Vérification Post-Paiement

Après chaque test de paiement, vérifiez :

1. **Dans Stripe Dashboard :**
   - Nouveau customer créé ✅
   - Subscription active ✅
   - Webhook reçu ✅

2. **Dans Supabase :**
   - Table `profiles` : champ `plan` mis à jour ✅
   - Logs de la fonction `stripe-webhook` ✅

3. **Dans l'Application :**
   - Page `/subscription` affiche le bon plan ✅
   - Features débloquées selon le plan ✅
   - Historique des factures visible ✅

---

## 📊 URLs Importantes

### Application
- Tarifs : `/pricing`
- Abonnement : `/subscription`
- Succès : `/payment/success`
- Annulation : `/payment/cancelled`

### Stripe Dashboard
- Webhooks : https://dashboard.stripe.com/webhooks
- Customer Portal : https://dashboard.stripe.com/settings/billing/portal
- Produits : https://dashboard.stripe.com/products
- Customers : https://dashboard.stripe.com/customers

### Supabase Dashboard
- Edge Functions : https://supabase.com/dashboard/project/dtozyrmmekdnvekissuh/functions
- Secrets : https://supabase.com/dashboard/project/dtozyrmmekdnvekissuh/settings/functions
- Database : https://supabase.com/dashboard/project/dtozyrmmekdnvekissuh/editor

---

## 🔧 Troubleshooting

### Le webhook ne fonctionne pas ?
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien configuré dans Supabase
2. Consultez les logs : https://supabase.com/dashboard/project/dtozyrmmekdnvekissuh/functions/stripe-webhook/logs
3. Vérifiez que l'URL du webhook est correcte dans Stripe

### Le plan ne se met pas à jour ?
1. Vérifiez les logs de `check-subscription`
2. Assurez-vous que le webhook a bien été reçu
3. Rafraîchissez manuellement via le bouton "Actualiser" sur `/subscription`

### Problèmes de Customer Portal ?
1. Vérifiez qu'il est activé dans Stripe Dashboard
2. Consultez les logs de `stripe-portal`
3. Assurez-vous que le customer existe bien dans Stripe

---

## ✨ Fonctionnalités Futures (Optionnelles)

- [ ] Essai gratuit de 14 jours
- [ ] Codes promo / Coupons
- [ ] Facturation annuelle avec réduction
- [ ] Plans personnalisés pour entreprises
- [ ] Notification par email des échecs de paiement

---

## 🎯 Prochaines Étapes

1. **Configurer le webhook Stripe** (5 min)
2. **Activer le Customer Portal** (2 min)
3. **Tester avec la carte de test** (5 min)
4. **Passer en mode production** quand prêt

**🎉 Votre système de paiement est prêt à recevoir des abonnements !**

---

Pour toute question, consultez la [documentation Stripe](https://stripe.com/docs) ou les logs Supabase.
