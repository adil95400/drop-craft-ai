# Guide Utilisateur - Drop Craft AI

## 📖 Table des Matières

1. [Introduction](#introduction)
2. [Démarrage Rapide](#démarrage-rapide)
3. [Gestion des Produits](#gestion-des-produits)
4. [Gestion des Commandes](#gestion-des-commandes)
5. [Fournisseurs & Synchronisation](#fournisseurs--synchronisation)
6. [Import & Export](#import--export)
7. [CRM & Clients](#crm--clients)
8. [Analytics & Rapports](#analytics--rapports)
9. [Intégrations](#intégrations)
10. [FAQ](#faq)

---

## 🎯 Introduction

Drop Craft AI est une plateforme complète de dropshipping assistée par IA qui vous permet de :

- 📦 Gérer votre catalogue produits avec optimisation IA
- 🛒 Automatiser vos commandes et livraisons
- 👥 Suivre vos clients et leads dans un CRM complet
- 📊 Analyser vos performances en temps réel
- 🔗 Synchroniser avec Shopify, AliExpress, BigBuy et plus

---

## 🚀 Démarrage Rapide

### Première Connexion

1. **Créer votre compte**
   - Rendez-vous sur la page d'inscription
   - Choisissez votre plan (Gratuit, Pro, Ultra Pro)
   - Validez votre email

2. **Configuration initiale**
   - Accédez au Dashboard principal
   - Configurez vos informations de boutique
   - Connectez vos premiers fournisseurs

3. **Import de vos produits**
   - Via CSV : `/import`
   - Via URL : `/import/url`
   - Via Shopify : `/import/shopify`
   - Via Fournisseurs : `/suppliers/marketplace`

---

## 📦 Gestion des Produits

### Catalogue Produits (`/products`)

#### Créer un Nouveau Produit

1. Cliquez sur **"Nouveau Produit"**
2. Remplissez les informations :
   - **Info** : Nom, description, catégorie
   - **Prix** : Prix, coût, marge
   - **SEO** : Meta title, meta description, slug
   - **Images** : Upload ou URL d'images
3. **Générer avec IA** (plans Pro/Ultra Pro) :
   - Cliquez sur l'icône ✨ pour générer automatiquement :
     - Description optimisée
     - Titre SEO
     - Meta description
     - Tags pertinents

#### Modifier un Produit

1. Dans le catalogue, cliquez sur **"Détails"**
2. Éditez les onglets souhaités
3. Cliquez sur **"Enregistrer"**

#### Actions Groupées

1. Sélectionnez plusieurs produits (checkbox)
2. Utilisez la barre d'actions groupées :
   - **Éditer en masse** : Modifier catégorie, statut, prix
   - **Dupliquer** : Créer des copies
   - **Exporter** : Télécharger en CSV
   - **Activer/Désactiver** : Changer le statut
   - **Supprimer** : Supprimer définitivement

#### Export CSV

1. Cliquez sur **"Exporter CSV"**
2. Le fichier contient : ID, Nom, Prix, Stock, Statut, Catégorie
3. Format compatible Excel et Google Sheets

---

## 🛍️ Gestion des Commandes

### Page Commandes (`/dashboard/orders`)

#### Visualiser les Commandes

- **Tableau complet** avec colonnes :
  - Numéro de commande
  - Client
  - Date
  - Statut
  - Montant
  - Actions

- **Filtres disponibles** :
  - Par statut : Pending, Processing, Shipped, Delivered, Cancelled
  - Par recherche : Numéro ou nom client

#### Actions sur une Commande

1. **Voir les détails** : Cliquez sur **"Détails"**
   - Affiche produits, adresse, paiement
   - Historique des changements de statut

2. **Changer le statut** :
   - Processing → Shipped → Delivered
   - Ou Cancelled si nécessaire

3. **Imprimer étiquette** :
   - Génération automatique (fonction à venir)
   - Format PDF prêt pour impression

#### Export des Commandes

1. Cliquez sur **"Exporter CSV"**
2. Le fichier contient :
   - Numéro, Client, Date, Statut
   - Montant, Devise, Nombre d'articles
3. Format compatible pour comptabilité

### Centre de Commandes Avancé (`/orders-center`)

Interface unifiée avec :
- Vue d'ensemble des commandes
- Statistiques temps réel
- Actions rapides
- Actualisation en direct

---

## 🔗 Fournisseurs & Synchronisation

### Hub Fournisseurs (`/suppliers`)

#### Connecter un Fournisseur

1. Accédez au **Marketplace** (`/suppliers/marketplace`)
2. Parcourez les fournisseurs disponibles :
   - AliExpress
   - BigBuy
   - Matterhorn
   - BTSWholesaler
   - Vidaxl
   - Et plus...

3. Cliquez sur **"Connecter"**
4. Choisissez le type de connexion :
   - **API** : Clé API ou credentials
   - **CSV** : URL du flux CSV
   - **XML** : URL du flux XML
   - **FTP** : Accès FTP avec host/user/password

5. Entrez vos credentials
6. Cliquez sur **"Connecter"**

#### Synchronisation des Produits

**Synchronisation Automatique** :
- Déclenchée automatiquement après connexion
- Import des produits dans votre catalogue

**Synchronisation Manuelle** :
1. Dans `/suppliers`, cliquez sur le menu du fournisseur
2. Sélectionnez **"Synchroniser"**
3. Suivez la progression en temps réel
4. Toast de confirmation avec nombre de produits importés

**Synchronisation Globale** :
- Bouton **"Synchroniser tous"** dans `/suppliers`
- Synchronise tous les fournisseurs actifs
- Notification pour chaque fournisseur

#### Gérer les Fournisseurs

1. **Voir les détails** : `/suppliers/:id`
   - Informations du fournisseur
   - Catalogue produits
   - Statistiques de performance

2. **Déconnecter** :
   - Cliquez sur **"Déconnecter"**
   - Confirme la révocation
   - Les produits restent dans votre catalogue

3. **Analytics** : `/suppliers/analytics`
   - Performance par fournisseur
   - Taux de succès
   - Revenus générés

---

## 📥 Import & Export

### Centre d'Import (`/import`)

#### Import CSV avec Validation

1. Cliquez sur l'onglet **"Nouvel Import"**
2. Glissez-déposez votre fichier CSV
3. La validation automatique détecte :
   - Colonnes manquantes
   - Erreurs de format
   - Doublons potentiels
4. Corrigez les erreurs si nécessaire
5. Cliquez sur **"Importer"**

**Format CSV attendu** :
```csv
name,price,cost_price,category,description,sku,stock
Produit A,29.99,15.00,Électronique,Description...,SKU-001,100
```

#### Import depuis URL

1. Page `/import/url`
2. Collez l'URL du produit
3. Cliquez sur **"Analyser"**
4. Prévisualisation des données extraites
5. Ajustez si nécessaire
6. Cliquez sur **"Importer"**

#### Import Shopify

1. Page `/import/shopify`
2. Connectez votre store Shopify
3. Sélectionnez les produits à importer
4. Configurez le mapping des champs
5. Lancez l'import

### Gestion des Imports (`/import/manage`)

- **Tableau de bord** : Vue d'ensemble des imports
- **Produits importés** : Liste complète avec filtres
- **Historique** : Tous les imports passés
- **Actions groupées** :
  - Approuver : `review_status='approved'`
  - Publier : `status='published'`
  - Rejeter : `review_status='rejected'`
  - Supprimer : Suppression définitive

---

## 👥 CRM & Clients

### Gestion des Clients (`/dashboard/customers`)

#### Créer un Client

1. Cliquez sur **"Nouveau Client"**
2. Remplissez le formulaire :
   - Nom, Email, Téléphone
   - Adresse complète
   - Notes et tags
3. Enregistrez

#### Segmentation

- Filtres par tags
- Filtres par valeur client (LTV)
- Filtres par date d'inscription
- Recherche par nom ou email

#### Historique Client

Pour chaque client :
- Commandes passées
- Montant total dépensé
- Panier moyen
- Dernière commande
- Notes et interactions

---

## 📊 Analytics & Rapports

### Dashboard Analytics (`/analytics`)

#### Métriques Principales

- **Revenus** : Total, par période, évolution
- **Commandes** : Nombre, taux de conversion
- **Produits** : Best-sellers, moins vendus
- **Clients** : Nouveaux, récurrents, LTV

#### Rapports Personnalisés

1. Sélectionnez la période
2. Choisissez les métriques
3. Exportez en PDF ou CSV
4. Partagez avec votre équipe

#### Analytics Fournisseurs

- Performance par fournisseur
- Taux de succès des syncs
- Produits par fournisseur
- Revenus par source

---

## 🔌 Intégrations

### Shopify

1. **Connexion** :
   - Settings → Integrations → Shopify
   - Entrez votre shop URL
   - Autorisez l'accès

2. **Synchronisation** :
   - Import produits depuis Shopify
   - Export produits vers Shopify
   - Sync commandes bidirectionnelle
   - Mise à jour stock temps réel

### AliExpress

1. **Configuration** :
   - Suppliers → Marketplace → AliExpress
   - Connectez avec API key

2. **Utilisation** :
   - Import produits gagnants
   - Suivi automatique des prix
   - Fulfillment automatisé

### BigBuy (Grossiste EU)

1. **Connexion** :
   - API credentials BigBuy
   - Validation de compte

2. **Catalogue** :
   - Accès à 100,000+ produits
   - Livraison EU 24-48h
   - Stock temps réel

---

## ❓ FAQ

### Général

**Q: Puis-je changer de plan à tout moment ?**
R: Oui, via `/billing`. Upgrade instantané, downgrade à la fin du cycle.

**Q: Mes données sont-elles sécurisées ?**
R: Oui, chiffrement SSL, RLS activé, conformité RGPD.

### Produits

**Q: Combien de produits puis-je gérer ?**
R: 
- Gratuit : 100
- Pro : 10,000
- Ultra Pro : Illimité

**Q: L'IA génère-t-elle du contenu unique ?**
R: Oui, descriptions SEO optimisées et uniques pour chaque produit.

### Commandes

**Q: Comment suivre mes commandes ?**
R: Dashboard → Orders, avec statuts temps réel et notifications.

**Q: Puis-je automatiser le fulfillment ?**
R: Oui, avec nos intégrations fournisseurs (plan Pro+).

### Fournisseurs

**Q: Combien de fournisseurs puis-je connecter ?**
R:
- Gratuit : 1
- Pro : 5
- Ultra Pro : Illimité

**Q: La synchronisation est-elle automatique ?**
R: Oui, déclenchée après connexion + option manuelle disponible.

### Support

**Q: Comment contacter le support ?**
R: 
- Email : support@dropcraftai.com
- Chat : Bouton en bas à droite
- Documentation : `/guides`

---

## 🎓 Tutoriels Vidéo

*(À venir)*

- [ ] Démarrage rapide (5 min)
- [ ] Import de produits (7 min)
- [ ] Connexion Shopify (10 min)
- [ ] Gestion des commandes (8 min)
- [ ] Configuration fournisseurs (12 min)

---

## 📞 Besoin d'Aide ?

- **Documentation** : [docs/](/)
- **Support** : support@dropcraftai.com
- **Communauté** : [Discord](#) (à venir)
- **Tutoriels** : [YouTube](#) (à venir)

---

**Dernière mise à jour** : ${new Date().toLocaleDateString('fr-FR')}

*Guide maintenu à jour avec chaque nouvelle fonctionnalité*
