# Audit des Boutons - Drop Craft AI

## 🟢 Boutons avec Fonctionnalités Réelles

### Dashboard (/dashboard)
- ✅ **QuickActions** - Tous les boutons sont des liens vers des vraies pages
  - Import Produits → `/import/advanced`
  - Sync Manager → `/sync-manager`
  - Centre Commandes → `/orders-center`
  - Analytics Pro → `/analytics`

### Page Produits (/products)
- ✅ **Nouveau produit** - Ouvre `CreateProductDialog` 
- ✅ **Actions de liste** - Sélection, tri, filtrage fonctionnels
- ✅ **Onglets** - Navigation entre Produits, Catégories, Stock, Analytics, etc.
- ⚠️ **Import/Export** - Callbacks vides (`onImport={() => {}}`, `onExport={() => {}}`)

### Page Commandes (/orders)
- ✅ **Actualiser** - Appelle `loadOrders()` pour recharger depuis Supabase
- ✅ **Filtres de statut** - Filtre fonctionnel (pending, processing, shipped, etc.)
- ✅ **Recherche** - Filtre par numéro de commande ou nom client
- ⚠️ **Exporter** - Bouton sans action (juste affichage)
- ⚠️ **Actions sur commandes** (Voir, Expédier, etc.) - À vérifier

## 🔴 Boutons Placeholders (Toast uniquement)

### Routes non implémentées
Les QuickActions pointent vers des routes qui n'existent pas encore :
- ❌ `/import/advanced` - Page non créée
- ❌ `/sync-manager` - Page non créée
- ❌ `/orders-center` - Page non créée (différent de `/orders`)

### Fonctionnalités à implémenter

#### Page Produits
- [ ] **Import CSV** - Callback vide
- [ ] **Export CSV** - Callback vide
- [ ] **Actions groupées** - UI présente mais actions manquantes
- [ ] **ProductActionsBar** - `onImport`, `onExport` vides

#### Général
- [ ] Vérifier tous les composants `ProductBulkOperations`
- [ ] Vérifier `ProductDetails` pour les actions de modification
- [ ] Vérifier les boutons dans `ProductInventory`
- [ ] Vérifier les actions dans `ProductCategories`

## 📋 Recommandations Prioritaires

### 1. **Routes Manquantes** (Priorité Haute)
Créer les pages suivantes :
- `/import/advanced` - Page d'import avancé
- `/sync-manager` - Gestionnaire de synchronisation
- `/orders-center` - Centre de commandes unifié

### 2. **Import/Export** (Priorité Moyenne)
Implémenter les fonctions réelles :
```typescript
const handleImport = async (file: File) => {
  // Parse CSV
  // Validate data
  // Insert to DB
  // Show success toast
}

const handleExport = async () => {
  // Fetch data
  // Format as CSV
  // Download file
  // Show success toast
}
```

### 3. **Actions sur Commandes** (Priorité Moyenne)
Implémenter :
- Voir détails commande
- Changer statut
- Ajouter numéro de suivi
- Imprimer bon de livraison

### 4. **Actions Groupées Produits** (Priorité Basse)
Implémenter :
- Modification en masse (prix, stock, catégorie)
- Suppression groupée
- Export sélection
- Publication/dépublication groupée

## 🔍 Comment Identifier les Placeholders

Chercher les patterns suivants dans le code :
```typescript
// 1. Callbacks vides
onClick={() => {}}
onImport={() => {}}

// 2. Toast sans action
onClick={() => toast({ title: "Fonctionnalité à venir" })}

// 3. console.log uniquement  
onClick={() => console.log("Action")}

// 4. Liens vers routes inexistantes
<Link to="/page-qui-existe-pas">
```

## ⚙️ Prochaines Étapes

1. ✅ **Corriger l'erreur RLS profiles** - FAIT
2. 🔄 **Créer les pages manquantes** - EN COURS
3. 🔄 **Implémenter Import/Export** - À FAIRE
4. 🔄 **Implémenter actions commandes** - À FAIRE
5. 🔄 **Implémenter actions groupées** - À FAIRE

---

**Dernière mise à jour** : 2025-10-13
**Status** : Audit initial terminé, erreur RLS corrigée ✅
