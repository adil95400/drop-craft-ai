
# Corrections des lacunes detectees dans l'application

## Objectif
Corriger les 4 problemes identifies lors de l'audit complet de l'application.

---

## 1. Ajouter les 6 icones manquantes

Les sous-modules suivants referent des icones absentes du ICON_MAP :
- `PieChart` -- Segmentation clients
- `UserPlus` -- Leads CRM
- `Award` -- Programme fidelite
- `Share2` -- Social commerce
- `Play` -- Declencheurs automation
- `Palette` -- Studio automation

**Fichiers modifies** : `src/config/navigation-constants.ts`, `src/lib/icon-map.ts`

---

## 2. Ajouter les sous-routes CRM manquantes

Le module CRM definit 5 sous-modules mais seul `/crm` a une route. Il faut ajouter `/crm/*` qui redirige vers `CRMDashboardPage` pour gerer les sous-routes.

**Fichier modifie** : `src/routes/index.tsx` -- changer `path="/crm"` en `path="/crm/*"`

---

## 3. Corriger la route `/profile`

La route `/profile` affiche actuellement `BillingPage` au lieu de la page profil. Correction pour pointer vers `ProfilePage`.

**Fichier modifie** : `src/routes/index.tsx` -- remplacer `BillingPage` par un import de `ProfilePage`

---

## 4. Corriger le mapping `FileText`

Remplacer `'FileText': FileEdit` par `'FileText': FileText` pour que l'icone des rapports soit correcte.

**Fichier modifie** : `src/config/navigation-constants.ts` -- ajouter l'import de `FileText` et corriger le mapping

---

## Details techniques

### navigation-constants.ts
- Ajouter imports : `PieChart, UserPlus, Award, Share2, Play, Palette, FileText`
- Ajouter dans ICON_MAP : 6 nouvelles entrees + corriger FileText

### icon-map.ts
- Ajouter les memes 7 icones pour coherence

### routes/index.tsx
- Ligne 176 : `/crm` devenir `/crm/*` avec le meme composant
- Ligne 225 : Remplacer `BillingPage` par `ProfilePage` (deja importe via lazy dans CoreRoutes)

---

## Impact
- Pas de changement de fonctionnalite visible pour l'utilisateur final
- Les icones s'afficheront correctement dans la sidebar pour les sous-modules
- Les sous-routes CRM ne retourneront plus 404
- La page profil affichera le bon contenu
