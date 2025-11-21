# Unified Payments - À REFACTORER OU SUPPRIMER

## ⚠️ STATUT: FONCTION MOCKÉE - NON FONCTIONNELLE

Cette edge function est actuellement complètement mockée et retourne des données fictives.

## Options de refactoring

### Option 1: Supprimer (RECOMMANDÉ)
Si vous n'utilisez pas de système de paiement unifié, supprimez cette fonction.

Les paiements Stripe doivent être gérés directement via:
- Le SDK Stripe côté frontend
- Les webhooks Stripe configurés dans Supabase
- La fonction `stripe-webhook` dédiée (si elle existe)

### Option 2: Implémenter vraie intégration
Si vous voulez unifier plusieurs processeurs de paiement:

1. **Stripe** - Principal processeur
   - Installer: `npm:stripe@latest` dans Deno
   - Configurer secret: `STRIPE_SECRET_KEY`
   - Implémenter checkout sessions

2. **PayPal** - Alternative
   - API: https://developer.paypal.com/
   - Configurer: `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`

3. **Autres processeurs**
   - Paddle, Lemon Squeezy, etc.

## Structure actuelle

```
/unified-payments/create-checkout → Mock checkout
/unified-payments/stripe-checkout → Mock Stripe
/unified-payments/create-payment → Mock payment
/unified-payments/customer-portal → Mock portal
```

## Recommandation

**SUPPRIMER** cette fonction et utiliser l'intégration Stripe native ou créer des fonctions spécifiques par processeur:
- `stripe-checkout/` pour Stripe
- `paypal-checkout/` pour PayPal
- etc.

**Ne pas utiliser** de "unified" wrapper qui complique l'architecture sans bénéfice réel.
