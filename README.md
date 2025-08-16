# Drop Craft AI - SaaS E-commerce Ultra Pro

## 🚀 Vue d'ensemble

Drop Craft AI est une plateforme SaaS complète pour automatiser et optimiser votre business e-commerce avec l'intelligence artificielle. Elle offre des intégrations réelles avec tous les principaux fournisseurs, marketplaces et outils de marketing.

## ✨ Fonctionnalités principales

### 🛒 Intégrations E-commerce
- **Shopify, WooCommerce, BigCommerce** - Synchronisation complète
- **AliExpress, Amazon, eBay** - Import automatique de produits
- **BigBuy, Cdiscount Pro** - Fournisseurs dropshipping européens

### 📊 Modules métiers
- **Catalogue intelligent** - Gestion avancée avec IA
- **Import multi-format** - CSV, XML, API, URL, images
- **CRM Ultra Pro** - Gestion clients et prospects 
- **Analytics Ultra Pro** - Tableaux de bord temps réel
- **Marketing automation** - Campagnes email et publicités
- **Tracking Ultra Pro** - Suivi de colis avec 17track
- **Reviews Ultra Pro** - Gestion d'avis avec Loox/Judge.me

### 🔒 Sécurité & Performance
- **Security Ultra Pro** - Monitoring avancé des menaces
- **SEO Ultra Pro** - Optimisation référencement complet
- **Support Ultra Pro** - Centre d'assistance IA

## 🛠 Installation et développement

### Prérequis
- Node.js 18+ 
- npm ou bun
- Compte Supabase
- Clés API des services à intégrer

### Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/drop-craft-ai.git
cd drop-craft-ai

# Installer les dépendances
npm install
# ou
bun install

# Copier la configuration d'environnement
cp .env.example .env

# Configurer vos clés API dans .env
# Voir la section "Configuration" ci-dessous
```

### Configuration Supabase

1. **Créer un projet Supabase** sur [supabase.com](https://supabase.com)

2. **Récupérer les clés**:
   - URL du projet
   - Clé publique (anon key)
   - Clé de service (service role key)

3. **Lancer les migrations**:
```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à votre projet
supabase link --project-ref VOTRE_PROJECT_ID

# Appliquer les migrations
supabase db push
```

### Configuration des API keys

Éditez le fichier `.env` avec vos vraies clés API:

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon

# E-commerce
SHOPIFY_API_KEY=votre_cle_shopify
ALIEXPRESS_API_KEY=votre_cle_aliexpress
BIGBUY_API_KEY=votre_cle_bigbuy

# Marketing
MAILCHIMP_API_KEY=votre_cle_mailchimp
GOOGLE_ADS_CLIENT_ID=votre_client_google_ads
FACEBOOK_ACCESS_TOKEN=votre_token_facebook

# Tracking
TRACK17_API_KEY=votre_cle_17track

# Reviews
LOOX_API_KEY=votre_cle_loox
JUDGE_ME_API_TOKEN=votre_token_judge_me

# IA
OPENAI_API_KEY=votre_cle_openai

# Paiement
STRIPE_SECRET_KEY=votre_cle_stripe
```

### Lancement en développement

```bash
# Serveur de développement
npm run dev
# ou 
bun dev

# Ouverture automatique sur http://localhost:5173
```

## 🏗 Architecture technique

### Stack technologique
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **État**: TanStack Query + Context API
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentification**: Supabase Auth
- **Stockage**: Supabase Storage
- **Déploiement**: Vercel

### Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants shadcn/ui
│   ├── admin/          # Interface d'administration
│   ├── catalog/        # Gestion du catalogue
│   ├── import/         # Modules d'import
│   └── integrations/   # Connecteurs API
├── hooks/              # Hooks personnalisés
├── pages/              # Pages de l'application
├── layouts/            # Layouts réutilisables  
├── contexts/           # Contextes React
├── utils/              # Utilitaires
└── lib/                # Configuration des librairies

supabase/
├── functions/          # Edge Functions (API)
├── migrations/         # Migrations base de données
└── config.toml         # Configuration Supabase
```

## 🔌 Intégrations disponibles

### E-commerce & Marketplaces
- **Shopify** - Synchronisation produits/commandes/stock
- **WooCommerce** - Intégration WordPress complète
- **BigCommerce** - API GraphQL enterprise
- **AliExpress** - Import automatique avec API officielle
- **Amazon** - Products API + Advertising API
- **eBay** - Trading API + Finding API
- **Cdiscount Pro** - Marketplace française

### Fournisseurs Dropshipping
- **BigBuy** - Fournisseur européen premium
- **Syncee** - Réseau global de fournisseurs
- **VidaXL** - Mobilier et décoration
- **Modalyst** - Fournisseurs premium US/EU

### Marketing & Analytics
- **Google Ads** - Création et gestion campagnes
- **Facebook Ads** - Publicités Facebook/Instagram
- **Mailchimp** - Email marketing automation
- **Klaviyo** - CDP e-commerce avancé
- **Google Analytics** - Suivi avancé GA4
- **Hotjar** - Heatmaps et session recordings

### Reviews & Customer Service
- **Loox** - Avis produits avec photos
- **Judge.me** - Plateforme d'avis complète
- **Okendo** - Reviews et Q&A
- **Trustpilot** - Avis entreprise
- **Zendesk** - Support client professionnel

### Paiement & Logistique
- **Stripe** - Processeur de paiement moderne
- **PayPal** - Solution globale trusted
- **Klarna** - Paiement en plusieurs fois
- **17track** - Suivi de colis international
- **AfterShip** - Notification de livraison

## 🚀 Déploiement

### Déploiement sur Vercel

1. **Connecter GitHub à Vercel**
2. **Importer le projet** 
3. **Configurer les variables d'environnement**:
   - Copier toutes les variables de `.env`
   - Ajouter les clés de production
4. **Déployer**

### Variables d'environnement de production

```env
NODE_ENV=production
VITE_SUPABASE_URL=https://votre-projet-prod.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_prod
# + toutes les autres clés API en version production
```

### Optimisations de performance

- **Lazy loading** des composants
- **Code splitting** automatique
- **Compression Gzip** activée
- **CDN** Vercel Edge Network
- **Cache** des ressources statiques

## 🐛 Debug React Query

### Configuration environnement
Contrôlez la visibilité des React Query Devtools avec les variables d'environnement :

- **Développement**: `VITE_ENABLE_RQ_DEVTOOLS=true` (par défaut)
- **Production**: `VITE_ENABLE_RQ_DEVTOOLS=false` (par défaut)
- **Staging**: `VITE_ENABLE_RQ_DEVTOOLS=false` (par défaut)

### Mode admin uniquement
Les devtools sont configurés pour s'afficher uniquement aux utilisateurs admin en développement. Les utilisateurs non-admin ne verront jamais le panneau même avec le flag activé.

### Raccourci clavier
Appuyez sur `Alt + D` pour basculer la visibilité du panneau devtools quand activé.

### Optimisation bundle
En production, React Query Devtools sont automatiquement exclus du bundle grâce au lazy loading et au tree-shaking.

## 🧪 Tests

### Tests unitaires
```bash
# Lancer les tests
npm run test

# Tests avec coverage
npm run test:coverage
```

### Tests E2E
```bash
# Tests Playwright
npm run test:e2e

# Tests en mode UI
npm run test:e2e:ui
```

## 📈 Monitoring et analytics

### Monitoring des erreurs
- **Sentry** pour le tracking des erreurs
- **Supabase Analytics** pour les métriques API
- **Vercel Analytics** pour les performances

### Métriques business
- Dashboard admin avec KPIs temps réel
- Suivi des conversions par canal
- Analytics avancés par module

## 🔐 Sécurité

### Authentification
- **Supabase Auth** avec RLS activé
- **JWT tokens** sécurisés
- **2FA** disponible pour les admins
- **Gestion des rôles** (admin, user, staff)

### Protection des données
- **Chiffrement** des clés API utilisateur
- **HTTPS** obligatoire
- **Conformité GDPR**
- **Audits de sécurité** réguliers

## 🤝 Contribution

### Développement

1. **Fork** le repository
2. **Créer** une branch feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Commiter** les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. **Push** vers la branch (`git push origin feature/nouvelle-fonctionnalite`)
5. **Créer** une Pull Request

### Standards de code

- **ESLint** + **Prettier** configurés
- **TypeScript** strict mode
- **Tests** obligatoires pour nouvelles features
- **Documentation** des composants

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

### Documentation
- **Guides utilisateur** : `/docs/user-guides/`
- **API Reference** : `/docs/api/`
- **Exemples** : `/docs/examples/`

### Contact
- **Email** : support@dropcraft.ai
- **Discord** : [Communauté Drop Craft AI](https://discord.gg/dropcraft)
- **Issues GitHub** : [Signaler un bug](https://github.com/votre-username/drop-craft-ai/issues)

---

**Drop Craft AI** - Automatisez votre e-commerce avec l'intelligence artificielle 🤖✨
