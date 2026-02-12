

# Analyse Gap : /products vs Concurrents (AutoDS, Channable, Minea)

## Ce que tu as deja (bien)
- Tableau responsive desktop/mobile avec lazy-loading images
- Filtres (recherche, statut, categorie)
- Actions bulk (supprimer, enrichir IA, exporter)
- Pagination
- Job tracker integre
- Import/Export CSV
- Duplication produit

---

## 7 fonctionnalites manquantes

### 1. Colonnes "Marge" et "Profit" dans le tableau
**Concurrents** : AutoDS et Channable affichent directement la marge brute et le profit par produit dans chaque ligne du tableau.
**Actuellement** : Le tableau montre Prix + Cout, mais ne calcule PAS la marge automatiquement.
**Correction** : Ajouter une colonne "Marge" avec badge colore (vert > 30%, jaune 15-30%, rouge < 15%).

### 2. Toggle Vue Grille / Vue Liste
**Concurrents** : Tous offrent un switch entre vue tableau et vue grille (cards visuelles avec grandes images).
**Actuellement** : Seule la vue tableau existe (desktop) ou cards basiques (mobile auto).
**Correction** : Ajouter un toggle `LayoutGrid / List` en haut a droite pour basculer entre les deux vues.

### 3. Tri par colonnes (Sort)
**Concurrents** : Clic sur l'en-tete de colonne pour trier par prix, stock, marge, date.
**Actuellement** : Aucun tri, juste du filtrage.
**Correction** : Ajouter des headers cliquables avec indicateur de direction (fleche haut/bas).

### 4. KPI Cards en haut de page (Mini Dashboard)
**Concurrents** : AutoDS affiche 4 StatCards au-dessus du tableau : Total produits, Stock total, Valeur stock, Marge moyenne.
**Actuellement** : Un seul badge "X produits" dans le header. Les KPIs sont dans /products/cockpit mais pas dans la vue catalogue.
**Correction** : Ajouter une rangee de 4 StatCards compactes entre le header et la toolbar.

### 5. Indicateur de Sante Produit (Health Score)
**Concurrents** : Channable affiche un score de completude par produit (titre, images, description, SEO).
**Actuellement** : Le health score existe dans la page detail mais n'est PAS visible dans le listing.
**Correction** : Ajouter un petit indicateur circulaire (0-100) ou une barre de progression dans chaque ligne.

### 6. Filtre par Source / Canal
**Concurrents** : AutoDS filtre par source d'importation (Shopify, AliExpress, Manuel, CSV).
**Actuellement** : Le champ `source` existe dans le modele de donnees mais aucun filtre n'est expose.
**Correction** : Ajouter un Select "Source" a cote des filtres existants.

### 7. Quick Actions Inline (sans menu)
**Concurrents** : AutoDS affiche des icones d'action rapide (edit, publish, optimize) directement visibles sans ouvrir le menu "...".
**Actuellement** : Toutes les actions sont cachees dans un DropdownMenu.
**Correction** : Afficher 2-3 icones d'action rapide (Modifier, Voir) en ligne, et garder le reste dans le menu "...".

---

## Plan d'implementation technique

### Fichiers a modifier
1. **`src/pages/products/CatalogProductsPage.tsx`**
   - Ajouter 4 StatCards (Total, Stock, Valeur, Marge moyenne) sous le header
   - Ajouter un toggle vue grille/liste
   - Ajouter un state `sortField` / `sortDirection` et la logique de tri
   - Ajouter un Select filtre par source

2. **`src/components/products/ResponsiveProductsTable.tsx`**
   - Ajouter colonne "Marge" avec calcul `((price - cost) / price * 100)`
   - Rendre les headers cliquables pour le tri (avec icones ArrowUp/ArrowDown)
   - Ajouter 2 icones d'action inline (Edit, Eye) avant le menu "..."
   - Ajouter mini indicateur health score (barre ou cercle)

3. **Nouveau : `src/components/products/ProductsGridView.tsx`**
   - Vue grille avec cards visuelles (grande image, nom, prix, marge, stock)
   - Checkbox de selection integree
   - Actions rapides au hover

### Ordre d'execution
1. StatCards KPI (impact visuel immediat)
2. Colonne Marge + Tri colonnes (valeur fonctionnelle)
3. Toggle Grille/Liste + composant GridView
4. Filtre Source + Quick Actions inline
5. Health Score inline

