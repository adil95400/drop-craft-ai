# Guide de Navigation - Drop Craft AI

## 🗺️ Architecture de Navigation

L'application utilise une architecture de navigation hiérarchique organisée en 15 groupes métier.

---

## 📍 Routes Principales

### 1. Vue d'ensemble
- `/dashboard` - Tableau de bord principal
- `/dashboard/profile` - Profil utilisateur
- `/dashboard/settings` - Paramètres

### 2. Catalogue & Produits
- `/products` - Catalogue produits principal
- `/products/audit` - Audit qualité
- `/products/intelligence` - Hub IA
- `/products/research` - Recherche de produits gagnants
- `/products/rules` - Règles d'automatisation
- `/products/qa` - Contrôle qualité
- `/products/sourcing` - Sourcing produits
- `/products/winners` - Winning Products
- `/products/ai-marketplace` - Marketplace IA
- `/products/premium-catalog` - Catalogue Premium
- `/products/profit-calculator` - Calculateur de marge
- `/products/create` - Créer un produit

### 3. Fournisseurs & Marketplace
- `/suppliers` - Hub fournisseurs
- `/suppliers/marketplace` - Marketplace fournisseurs
- `/suppliers/my` - Mes fournisseurs connectés
- `/suppliers/premium` - Fournisseurs premium
- `/suppliers/:id` - Détails fournisseur
- `/suppliers/:id/catalog` - Catalogue fournisseur
- `/suppliers/analytics` - Analytics fournisseurs
- `/suppliers/settings` - Configuration fournisseurs

### 4. Import & Flux
- `/import` - Hub d'import
- `/import/quick` - Import rapide
- `/import/advanced` - Import avancé
- `/import/history` - Historique imports
- `/import/scheduled` - Imports planifiés
- `/import/config` - Configurations
- `/import/simplified` - Import simplifié
- `/feeds` - Gestion des feeds
- `/feeds/optimization` - Optimisation feeds

### 5. Commandes
- `/dashboard/orders` - Gestion commandes
- `/orders-center` - Centre de commandes
- `/orders/create` - Créer une commande
- `/fulfillment` - Dashboard fulfillment
- `/fulfillment/rules` - Règles fulfillment
- `/fulfillment/carriers` - Gestion transporteurs

### 6. Clients & CRM
- `/dashboard/customers` - Gestion clients
- `/customers/create` - Créer un client
- `/reviews` - Avis clients

### 7. Marketing & Growth
- `/marketing` - Hub marketing
- `/coupons` - Gestion coupons
- `/trial` - Activation essai gratuit

### 8. Analytics & BI
- `/analytics` - Analytics principal
- `/analytics/predictive` - Analytics prédictive

### 9. IA & Intelligence
- `/audit` - Audit IA
- `/rewrite` - Réécriture contenu IA
- `/attributes` - Génération attributs IA

### 10. Automations & Workflows
- `/automation` - Hub automation
- `/automation/repricing` - Repricing dynamique
- `/rules` - Règles produits
- `/catalog-intelligence` - Intelligence catalogue

### 11. Stock & Logistique
- `/stock` - Gestion stock

### 12. Boutiques & Canaux
- `/dashboard/stores` - Mes boutiques
- `/integrations/marketplace/hub` - Hub marketplaces
- `/store` - Boutique Shopify publique
- `/store/product/:handle` - Détail produit boutique

### 13. Abonnements & Facturation
- `/dashboard/billing` - Facturation
- `/dashboard/subscription` - Gestion abonnement

### 14. Paramètres & Administration
- `/dashboard/settings` - Paramètres
- `/extensions` - Extensions
- `/admin` - Panel admin (admin only)

### 15. Support & Aide
- `/support` - Centre de support
- `/academy` - Academy
- `/guides/getting-started` - Guide de démarrage
- `/integrations/api/documentation` - Documentation API

---

## 🔄 Redirections Automatiques

### Routes Legacy (Anciennes URLs)
Ces routes redirigent automatiquement vers les nouvelles URLs:

```typescript
/tracking → /dashboard/orders
/crm → /dashboard/customers
/customers → /dashboard/customers
/orders → /dashboard/orders
/catalog → /products
/subscription → /dashboard/subscription
/profile → /dashboard/profile
/settings → /dashboard/settings
```

### Modern Routes (Interface Moderne)
```typescript
/modern/products → /products
/modern/customers → /dashboard/customers
/modern/orders → /dashboard/orders
/modern/marketing → /marketing
/modern/suppliers → /suppliers
/modern/import → /import
/modern/billing → /dashboard/billing
```

---

## 🎯 Navigation par Rôle

### Utilisateur Standard
Accès à:
- Dashboard
- Produits (basique)
- Commandes
- Clients
- Import (limité)

### Utilisateur Pro
Accès Standard +
- Fournisseurs premium
- Analytics avancées
- IA & Automations
- Feeds multi-canaux

### Utilisateur Ultra Pro
Accès Pro +
- Analytics prédictive
- Repricing dynamique
- Extensions avancées
- API complète

### Administrateur
Accès total +
- Panel admin (`/admin`)
- Gestion utilisateurs
- Configuration système
- Monitoring avancé

---

## 🔍 Navigation Contextuelle

### Breadcrumbs Dynamiques
Générés automatiquement selon la route:

```
Accueil > Produits > Catalogue
Accueil > Fournisseurs > Marketplace > Matterhorn
Accueil > Analytics > Prédictive
```

### Sidebar Adaptative
- Groupes collapsibles par métier
- Modules filtrés par plan utilisateur
- Favoris en haut
- Recherche intégrée

### Quick Actions
Depuis le Dashboard:
- Import Produits → `/import/advanced`
- Sync Manager → `/sync-manager`
- Centre Commandes → `/orders-center`
- Analytics Pro → `/analytics`

---

## ⚠️ Routes Protégées

### Authentification Requise
Toutes les routes sous:
- `/dashboard/*`
- `/products/*`
- `/analytics/*`
- `/automation/*`
- `/marketing/*`
- `/integrations/*`
- `/enterprise/*`
- `/extensions/*`
- `/audit/*`
- `/stock/*`
- `/import/*`
- `/feeds/*`
- `/suppliers/*`

### Admin Uniquement
- `/admin/*` - Nécessite rôle `is_admin`

### Routes Publiques
- `/` - Landing page
- `/auth` - Connexion/Inscription
- `/pricing` - Tarifs
- `/features` - Fonctionnalités
- `/about` - À propos
- `/contact` - Contact
- `/docs` - Documentation publique
- `/store` - Boutique Shopify (si configurée)

---

## 🚀 Navigation Programmatique

### Utilisation dans les Composants

```typescript
import { useNavigate } from 'react-router-dom';

// Navigation simple
const navigate = useNavigate();
navigate('/products');

// Navigation avec état
navigate('/products/create', { 
  state: { from: 'dashboard' } 
});

// Navigation avec remplacement
navigate('/dashboard', { replace: true });
```

### Utilisation du Service de Navigation

```typescript
import { NavigationService } from '@/utils/navigation';

// Navigation sécurisée avec validation
NavigationService.goTo('/products');

// Helpers spécifiques
NavigationService.goToDashboard();
NavigationService.goToModule('products', 'audit');
NavigationService.goBack();
```

---

## 📱 Navigation Mobile

### Bottom Navigation (Mobile)
Sur mobile, navigation rapide vers:
- Dashboard
- Produits
- Commandes
- Plus (menu complet)

### Swipe Gestures
- Swipe gauche: Ouvrir sidebar
- Swipe droite: Fermer sidebar
- Swipe bas: Actualiser

---

## 🎨 Personnalisation Navigation

### Favoris
Les utilisateurs peuvent marquer leurs modules favoris:
- Affichés en haut de la sidebar
- Accès rapide 1 clic
- Synchronisés par utilisateur

### Recherche Modules
- Raccourci: `Cmd/Ctrl + K`
- Recherche par nom, description, features
- Résultats filtrés par accès utilisateur

---

## 🔧 Configuration Navigation

### MODULE_REGISTRY
**Fichier**: `src/config/modules.ts`

Définit tous les modules avec:
- `id`: Identifiant unique
- `name`: Nom affiché
- `icon`: Icône Lucide
- `route`: Route du module
- `minPlan`: Plan minimum requis
- `groupId`: Groupe de navigation
- `features`: Liste des fonctionnalités
- `order`: Ordre d'affichage

### NAV_GROUPS
**Fichier**: `src/config/modules.ts`

Définit les 15 groupes de navigation:
- `id`: Identifiant unique
- `label`: Libellé affiché
- `icon`: Icône Lucide
- `order`: Ordre d'affichage

---

## ✅ Validation Navigation

### Tests à effectuer
- [ ] Tous les liens sidebar fonctionnent
- [ ] Aucune route 404 dans l'app
- [ ] Redirections legacy actives
- [ ] Breadcrumbs corrects
- [ ] Navigation mobile fluide
- [ ] Favoris fonctionnels
- [ ] Recherche opérationnelle

### Debugging Navigation
Si un lien ne fonctionne pas:
1. Vérifier la route dans `src/routes/index.tsx`
2. Vérifier le MODULE_REGISTRY
3. Vérifier les permissions (minPlan)
4. Consulter la console navigateur

---

**Guide mis à jour le**: ${new Date().toLocaleDateString('fr-FR')}
**Version**: 1.0.0
**Statut**: ✅ À jour
