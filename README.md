# Drop Craft AI - SaaS E-commerce Ultra Pro

<div align="center">

![Drop Craft AI Logo](https://your-logo-url.com/logo.png)

[![Build Status](https://github.com/adil95400/drop-craft-ai/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/adil95400/drop-craft-ai/actions)
[![Security Rating](https://img.shields.io/badge/security-A-green)](https://github.com/adil95400/drop-craft-ai/security)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Automatisez votre e-commerce avec l'intelligence artificielle** 🤖✨

[🚀 Demo Live](https://drop-craft-ai.vercel.app) • [📖 Documentation](https://github.com/adil95400/drop-craft-ai/wiki) • [🐛 Report Bug](https://github.com/adil95400/drop-craft-ai/issues) • [✨ Request Feature](https://github.com/adil95400/drop-craft-ai/issues)

</div>

---

## 🎯 À propos

Drop Craft AI est une plateforme SaaS complète qui révolutionne la gestion e-commerce grâce à l'intelligence artificielle. Intégrations natives avec tous les principaux fournisseurs, marketplaces et outils marketing, automatisation poussée et analytics en temps réel.

### 🏆 Points forts

- ⚡ **Performance optimisée** - React 18 + Vite + TypeScript strict
- 🔐 **Sécurité entreprise** - RLS Supabase + chiffrement bout en bout  
- 🤖 **IA native** - OpenAI + automatisation intelligente
- 🔄 **Intégrations réelles** - API officielles Shopify, AliExpress, Amazon
- 📊 **Analytics Ultra Pro** - Métriques temps réel + prédictions IA
- 🚀 **SaaS ready** - Multi-tenant + plans d'abonnement Stripe

## 🛠️ Stack Technique

### Frontend
- **Framework**: React 18 + TypeScript 5.5+
- **Build Tool**: Vite avec optimisations avancées
- **Styling**: Tailwind CSS + shadcn/ui components
- **État global**: TanStack Query + Context API
- **Animations**: Framer Motion + CSS animations

### Backend & Infrastructure  
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentification**: Supabase Auth + RLS policies
- **Stockage**: Supabase Storage + CDN
- **CI/CD**: GitHub Actions + tests automatisés
- **Déploiement**: Vercel avec optimisations

### Intégrations E-commerce
- **Shopify**: OAuth + GraphQL Admin API + Webhooks
- **AliExpress**: API officielle + import automatique
- **Amazon**: Products API + Advertising API  
- **BigBuy**: Fournisseur européen + catalogue sync
- **eBay**: Trading API + gestion listings

## 🚀 Installation & Configuration

### Prérequis

- **Node.js** 18+ (recommandé: 20+)
- **npm** 9+ ou **pnpm** 8+
- **Git** configuré
- Compte **Supabase** (gratuit)

### Installation rapide

```bash
# Cloner le repository
git clone https://github.com/adil95400/drop-craft-ai.git
cd drop-craft-ai

# Installation des dépendances (avec pnpm - recommandé)
pnpm install --frozen-lockfile

# Ou avec npm
npm ci

# Configuration de l'environnement
cp .env.example .env
# Éditez .env avec vos clés API (voir section Configuration)
```

### Configuration Supabase

1. **Créer un projet** sur [supabase.com](https://supabase.com)

2. **Récupérer les informations de connexion**:
   ```bash
   # Dans votre dashboard Supabase > Settings > API
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Appliquer les migrations**:
   ```bash
   # Installer Supabase CLI
   npm install -g supabase
   
   # Se connecter à votre projet  
   supabase link --project-ref YOUR_PROJECT_ID
   
   # Appliquer toutes les migrations
   supabase db push
   ```

### Lancement en développement

```bash
# Serveur de développement
pnpm dev
# Ouverture automatique sur http://localhost:5173

# Avec debug React Query DevTools
VITE_ENABLE_RQ_DEVTOOLS=true pnpm dev
```

## ⚙️ Scripts de développement

| Script | Description |
|--------|-------------|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm lint` | Vérification ESLint |
| `pnpm lint:fix` | Correction automatique |
| `pnpm format` | Formatage Prettier |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm test` | Tests unitaires |
| `pnpm preview` | Aperçu du build |

## 🏗️ Architecture du Projet

```
src/
├── 📁 components/          # Composants réutilisables
│   ├── 🎨 ui/             # shadcn/ui components  
│   ├── 👑 admin/          # Interface d'administration
│   ├── 📦 catalog/        # Gestion catalogue produits
│   ├── 📥 import/         # Modules d'import avancés
│   ├── 🔗 integrations/   # Connecteurs API tiers
│   └── 🔒 auth/           # Authentification & sécurité
├── 🪝 hooks/              # Hooks personnalisés
├── 📄 pages/              # Pages de l'application  
├── 🎨 layouts/            # Layouts réutilisables
├── 🧠 contexts/           # Contextes React
├── 🛠️ utils/              # Fonctions utilitaires
└── 📚 lib/                # Configuration librairies

supabase/
├── ⚡ functions/          # Edge Functions (API)
├── 🗃️ migrations/         # Migrations BDD
└── ⚙️ config.toml         # Configuration Supabase
```

## 🔌 Intégrations Disponibles

### 🛒 E-commerce & Marketplaces
| Service | Statut | Fonctionnalités |
|---------|--------|-----------------|
| **Shopify** | ✅ Production | Sync produits/commandes/stock + webhooks |
| **AliExpress** | ✅ Production | Import automatique + suivi commandes |
| **Amazon** | 🚧 Bêta | Products API + gestion FBA |
| **eBay** | 🚧 Bêta | Trading API + gestion listings |
| **WooCommerce** | ✅ Production | API REST + synchronisation |
| **BigCommerce** | 📋 Planifié | GraphQL API enterprise |

### 📊 Marketing & Analytics
| Service | Statut | Fonctionnalités |
|---------|--------|-----------------|
| **Google Ads** | ✅ Production | Création campagnes + optimisation |
| **Facebook Ads** | ✅ Production | Publicités FB/IG + audiences |
| **Mailchimp** | ✅ Production | Email automation + segmentation |
| **Klaviyo** | 🚧 Bêta | CDP e-commerce avancé |
| **Google Analytics** | ✅ Production | Suivi GA4 + conversion |

### 🎯 Reviews & Support
| Service | Statut | Fonctionnalités |
|---------|--------|-----------------|
| **Loox** | ✅ Production | Avis photo + UGC |
| **Judge.me** | ✅ Production | Plateforme d'avis complète |
| **Zendesk** | 🚧 Bêta | Support client pro |
| **Trustpilot** | 📋 Planifié | Réputation entreprise |

## 🚀 Déploiement

### Déploiement Vercel (Recommandé)

1. **Fork le repository** sur votre compte GitHub

2. **Connecter à Vercel**:
   - Aller sur [vercel.com](https://vercel.com)
   - Import Git Repository
   - Sélectionner votre fork

3. **Configuration des variables d'environnement**:
   ```bash
   # Variables de production à configurer dans Vercel
   NODE_ENV=production
   VITE_SUPABASE_URL=https://your-prod-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-prod-anon-key
   # + toutes vos clés API de production
   ```

4. **Déployer** 🚀

### Optimisations de Performance

- ⚡ **Lazy loading** automatique des composants
- 📦 **Code splitting** intelligent par route
- 🗜️ **Compression Gzip/Brotli** activée
- 🌐 **CDN** Vercel Edge Network mondial
- 💾 **Cache** agressif des ressources statiques
- 🖼️ **Images optimisées** avec Next/Image

## 🧪 Tests & Qualité

### Tests automatisés
```bash
# Tests unitaires
pnpm test

# Tests avec coverage
pnpm test:coverage

# Tests E2E Cypress  
pnpm test:e2e
```

### Qualité de code
- ✅ **ESLint** configuré en mode strict
- ✅ **Prettier** formatage automatique
- ✅ **TypeScript** strict mode + no implicit any
- ✅ **Husky** hooks pre-commit
- ✅ **lint-staged** vérifications automatiques

## 🔐 Sécurité

### Mesures de sécurité implémentées
- 🔒 **Row Level Security (RLS)** sur toutes les tables
- 🔑 **JWT** avec rotation automatique
- 🛡️ **CSRF** protection + CORS configuré
- 🔐 **Chiffrement** des clés API utilisateur
- 📝 **Audit logs** pour toutes les actions sensibles
- 🚨 **Rate limiting** sur les endpoints critiques

### Signalement de vulnérabilités
Voir [SECURITY.md](SECURITY.md) pour les procédures de signalement sécurisé.

## 📈 Monitoring & Analytics

### Métriques surveillées
- 📊 **Performance** - Web Vitals + load times
- 🐛 **Erreurs** - Sentry integration + stack traces  
- 💼 **Business** - KPIs temps réel + conversions
- 🔄 **API** - Latence + taux d'erreur + quotas

### Dashboards disponibles
- 👑 **Admin Dashboard** - Métriques globales + utilisateurs
- 📊 **Analytics Dashboard** - Business intelligence
- 🔧 **Technical Dashboard** - Performance + monitoring

## 🛣️ Roadmap

### 🎯 Version 1.1 (Q2 2024)
- [ ] **Amazon FBA** - Integration complète
- [ ] **eBay Motors** - Support véhicules/pièces  
- [ ] **TikTok Shop** - Nouveau marketplace
- [ ] **AI Content Generator** - Descriptions produits
- [ ] **Multi-language** - Support 5+ langues

### 🎯 Version 1.2 (Q3 2024)  
- [ ] **Mobile App** - React Native
- [ ] **Advanced Analytics** - Prédictions ML
- [ ] **White Label** - Solution partenaires
- [ ] **API publique** - Webhooks + REST API
- [ ] **Marketplace interne** - Templates + addons

### 🎯 Version 2.0 (Q4 2024)
- [ ] **Multi-tenant SaaS** - Isolation complète
- [ ] **Enterprise features** - SSO + audit avancé
- [ ] **AI Assistant** - Chatbot intelligent  
- [ ] **Advanced automations** - Workflows visuels
- [ ] **Real-time collaboration** - Teams + permissions

## 🤝 Contribution

### Pour contribuer

1. **Fork** le repository
2. **Créer** une branche feature (`git checkout -b feature/amazing-feature`)
3. **Commit** vos changements (`git commit -m 'feat: add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrir** une Pull Request

### Standards de contribution
- 📝 **Convention de commits** - [Conventional Commits](https://www.conventionalcommits.org/)
- ✅ **Tests** obligatoires pour les nouvelles features
- 📖 **Documentation** mise à jour
- 🎨 **Code review** obligatoire

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les détails complets.

## 📞 Support & Community

### 💬 Obtenir de l'aide
- 📧 **Email**: support@dropcraft.ai
- 💬 **Discord**: [Rejoindre la communauté](https://discord.gg/dropcraft-ai)
- 🐛 **Issues**: [Signaler un bug](https://github.com/adil95400/drop-craft-ai/issues)
- 💡 **Features**: [Demander une fonctionnalité](https://github.com/adil95400/drop-craft-ai/issues)

### 📚 Documentation
- 📖 **Guide utilisateur**: [docs/user-guide](docs/user-guide/)
- 🔧 **API Reference**: [docs/api](docs/api/)
- 🎥 **Tutoriels vidéo**: [YouTube Channel](https://youtube.com/@dropcraft-ai)
- 💼 **Cas d'usage**: [docs/examples](docs/examples/)

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- 💙 **Supabase** - Backend-as-a-Service incroyable
- ⚡ **Vercel** - Déploiement et hébergement
- 🎨 **shadcn/ui** - Composants UI magnifiques  
- 🚀 **Vite** - Build tool ultra-rapide
- 💪 **React Team** - Framework fantastique

---

<div align="center">

**Fait avec ❤️ par [Adil Oubala](https://github.com/adil95400)**

[![GitHub followers](https://img.shields.io/github/followers/adil95400?style=social)](https://github.com/adil95400)
[![Twitter Follow](https://img.shields.io/twitter/follow/adil95400?style=social)](https://twitter.com/adil95400)

**Drop Craft AI** - Automatisez votre e-commerce avec l'intelligence artificielle 🚀

</div>
