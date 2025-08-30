# Dropshipping Pro - Plateforme SaaS E-commerce

Une plateforme complète de gestion de dropshipping avec intégration multi-fournisseurs, synchronisation automatique et outils IA avancés.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+ et npm/yarn
- Compte Supabase (gratuit)
- Compte Stripe (pour les paiements)

### Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd dropshipping-pro
   npm install
   ```

2. **Configuration environnement**
   ```bash
   cp .env.example .env
   # Remplir les variables dans .env
   ```

3. **Configuration Supabase**
   - Créer un projet sur [supabase.com](https://supabase.com)
   - Copier l'URL et la clé publique dans `.env`
   - Exécuter les migrations SQL (voir `/supabase/migrations/`)

4. **Configuration Stripe**
   - Créer un compte sur [stripe.com](https://stripe.com)
   - Ajouter les clés API dans les secrets Supabase

5. **Lancer l'application**
   ```bash
   npm run dev
   ```

## 📋 Fonctionnalités principales

### ✅ Implémenté
- 🔐 **Authentification** - Supabase Auth avec RLS
- 💳 **Plans & Paiements** - Stripe avec 3 niveaux (Standard/Pro/Ultra Pro)
- 📦 **Gestion fournisseurs** - BigBuy, Cdiscount Pro, Amazon, AliExpress
- 🔄 **Import produits** - CSV, XML, API avec mapping intelligent
- 🛒 **Intégrations boutiques** - Shopify, WooCommerce, PrestaShop
- 📊 **Analytics temps réel** - Dashboard complet avec métriques
- 🤖 **IA intégrée** - Optimisation titres, descriptions, SEO
- 🎯 **CRM & Marketing** - Gestion clients et campagnes

### 🚧 En développement
- 🔄 **Synchronisation continue** - Cron jobs et webhooks
- 📱 **App mobile** - Flutter pour gestion nomade
- 🌍 **Internationalisation** - Support multi-langues
- 🔍 **SEO avancé** - Optimisation automatique IA

## 🏗️ Architecture technique

### Frontend
- **React 18** avec TypeScript
- **Tailwind CSS** pour le design système
- **Shadcn/ui** pour les composants
- **Vite** pour le build optimisé

### Backend
- **Supabase** - Base de données PostgreSQL + Auth + Edge Functions
- **Row Level Security** pour la sécurité des données
- **Edge Functions** pour la logique métier

### Paiements & Plans
- **Stripe** - Gestion abonnements et paiements
- **3 niveaux** - Standard (gratuit), Pro (€29/mois), Ultra Pro (€79/mois)

## 📁 Structure du projet

```
src/
├── components/          # Composants UI réutilisables
│   ├── ui/             # Components Shadcn/ui
│   ├── onboarding/     # Guide de démarrage
│   ├── plan/           # Gestion des plans
│   └── ...
├── pages/              # Pages principales
├── hooks/              # Hooks React personnalisés
├── contexts/           # Contexts React (Auth, Plan)
├── utils/              # Utilitaires et helpers
└── integrations/       # Intégrations Supabase

supabase/
├── functions/          # Edge Functions Deno
└── migrations/         # Migrations SQL
```

## 🔧 Configuration des variables

Copier `.env.example` vers `.env` et configurer:

```bash
# Supabase (obligatoire)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Stripe (obligatoire pour paiements)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optionnel
VITE_SENTRY_DSN=https://...      # Monitoring erreurs
VITE_GA_TRACKING_ID=GA-...       # Google Analytics
VITE_DEBUG_MODE=true             # Mode développement
```

## 🎯 Guide de démarrage

### Étape 1: Configuration du plan
1. Aller sur `/pricing`
2. Choisir Standard (gratuit) ou Pro/Ultra Pro
3. Finaliser le paiement Stripe si nécessaire

### Étape 2: Connecter une boutique
1. Aller sur `/integrations`
2. Connecter Shopify, WooCommerce ou PrestaShop
3. Configurer les paramètres de synchronisation

### Étape 3: Ajouter des fournisseurs (Pro+)
1. Aller sur `/suppliers`
2. Connecter BigBuy, Cdiscount Pro, etc.
3. Configurer les flux de données

### Étape 4: Importer des produits (Pro+)
1. Aller sur `/import`
2. Choisir la source (fournisseur ou fichier)
3. Mapper les champs et lancer l'import

### Étape 5: Optimisation IA (Ultra Pro)
1. Activer l'optimisation automatique
2. Configurer les règles SEO
3. Suivre les performances

## 🔒 Sécurité & Conformité

### Données protégées
- **RGPD compliant** - Consentement et suppression
- **Row Level Security** - Isolation des données utilisateur
- **Chiffrement** - Credentials fournisseurs chiffrés
- **Audit trail** - Logs de toutes les actions

### Monitoring
- **Sentry** - Surveillance erreurs en temps réel
- **Logs structurés** - Debugging et analytics
- **Rate limiting** - Protection contre les abus

## 🚀 Déploiement

### Production
```bash
# Build optimisé
npm run build

# Preview local
npm run preview

# Déployer (Vercel/Netlify)
# Les Edge Functions Supabase se déploient automatiquement
```

### Environnements
- **Development** - Local avec hot-reload
- **Staging** - Preview branches automatique
- **Production** - Domaine principal avec monitoring

## 🆘 Support

### Problèmes courants

**Erreur Supabase connection**
```bash
# Vérifier les variables d'environnement
echo $VITE_SUPABASE_URL
# Vérifier les politiques RLS
```

**Erreur Stripe webhook**
```bash
# Configurer l'endpoint webhook dans Stripe Dashboard
# URL: https://xxx.supabase.co/functions/v1/stripe-webhook
```

**Import produits échoue**
```bash
# Vérifier les quotas du plan actuel
# Vérifier les credentials fournisseurs
```

### Contact
- 📧 **Email** - support@dropshipping-pro.com
- 💬 **Chat** - Support intégré dans l'app (Pro+)
- 📖 **Documentation** - `/help` dans l'application

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changes (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir `LICENSE` pour plus de détails.

---

**Made with ❤️ for e-commerce entrepreneurs**