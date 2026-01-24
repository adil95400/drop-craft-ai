
# Plan d'Amelioration de la Page Parametres

## Analyse de l'Existant

Apres analyse complete, voici ce qui est deja implemente:

| Fonctionnalite | Statut | Commentaire |
|----------------|--------|-------------|
| **Photo de profil** | Partiel | Upload disponible via `AvatarUpload` mais manque: preview avant upload, recadrage, suppression photo |
| **Mise a jour abonnement** | Partiel | `BillingTab` existe avec plans simules mais pas d'integration reelle Stripe/paiement |
| **Conversion auto devises** | Complet | `CurrenciesTab` avec parametres, convertisseur, historique et bulk conversion |
| **Gestion API** | Complet | `ApiTab` avec generation, affichage, copie et suppression de cles |
| **Langue** | Complet | Selection FR/EN/ES/DE dans `AppearanceTab` avec i18n |
| **Securite** | Complet | Changement mot de passe, 2FA, sessions actives |

---

## Ameliorations Proposees

### 1. Profil Utilisateur - Ameliorations Photo

**Manque actuellement:**
- Preview de l'image avant upload
- Option de suppression de la photo
- Recadrage/redimensionnement
- Indication du format/taille acceptes

**Modifications `AvatarUpload.tsx`:**
- Ajouter un modal de preview avec confirmation
- Bouton de suppression avec confirmation
- Afficher les specs acceptees (JPG/PNG, max 5MB)
- Animation de chargement amelioree

### 2. Gestion des Abonnements - Integration Complete

**Manque actuellement:**
- Integration avec un systeme de paiement reel
- Affichage du plan actuel dynamique depuis la base de donnees
- Compteurs d'usage (produits, API calls, etc.)
- Modal de confirmation avant changement de plan
- Gestion de la periode d'essai

**Modifications `BillingTab.tsx`:**
- Connecter au hook `usePlan` existant pour plan actuel reel
- Ajouter section "Usage du plan" avec barres de progression
- Indicateur de periode d'essai restante
- Bouton "Contacter pour Enterprise"
- Lien vers `/pricing` pour comparaison detaillee

### 3. Ameliorations Generales UI/UX

**Manque actuellement:**
- Barre de progression de completion du profil
- Raccourcis rapides en haut de page
- Indicateurs de sauvegarde automatique
- Mode "Danger Zone" pour actions critiques

**Ajouts proposes:**
- Card "Completion du profil" avec pourcentage
- Quick actions: "Verifier email", "Activer 2FA", "Ajouter photo"
- Section "Zone de danger" pour suppression compte

### 4. Onglet Langue Dedie (Optionnel)

**Actuellement:** La langue est dans l'onglet Apparence

**Proposition:** Creer un onglet dedie "Langues & Region" avec:
- Selection de langue
- Format de date (DD/MM/YYYY vs MM/DD/YYYY)
- Format d'heure (24h vs 12h AM/PM)
- Premier jour de la semaine

---

## Fichiers a Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/common/AvatarUpload.tsx` | Modifier | Preview modal, bouton suppression, specs |
| `src/components/settings/ProfileTab.tsx` | Modifier | Card completion profil, zone danger |
| `src/components/settings/BillingTab.tsx` | Modifier | Connexion plan reel, usage, trial |
| `src/components/settings/index.ts` | Modifier | Export nouveau composant si ajoute |
| `src/pages/Settings.tsx` | Modifier | Quick actions, layout ameliore |

---

## Details Techniques

### AvatarUpload Ameliore

```text
+------------------------------------------+
|  [Avatar]  [Changer]  [Supprimer]        |
|                                          |
|  Formats: JPG, PNG, GIF                  |
|  Taille max: 5 MB                        |
|  Dimensions recommandees: 200x200px      |
+------------------------------------------+
```

Logique:
- `onFileSelect`: Ouvrir modal preview au lieu d'upload direct
- Bouton "Confirmer" dans modal pour lancer l'upload
- Bouton "Supprimer" avec confirmation

### BillingTab Connecte

```text
+------------------------------------------+
| Votre Plan: [Pro]  Trial: 7 jours        |
+------------------------------------------+
| Usage ce mois:                           |
| - Produits: 450/1000 [====------] 45%    |
| - API Calls: 2400/10000 [==--------] 24% |
| - Stockage: 1.2GB/5GB [====------] 24%   |
+------------------------------------------+
```

Connexions:
- `useUnifiedPlan()` pour plan actuel et features
- Afficher usage reel depuis les tables `products`, `api_keys_usage`
- Date de renouvellement/fin trial

### Completion du Profil

```text
Score: 70% [==============--------]

[ ] Ajouter une photo de profil
[x] Email verifie
[x] Mot de passe defini
[ ] Activer 2FA
[x] Entreprise renseignee
[ ] Site web ajoute
```

### Zone de Danger

```text
+------------------------------------------+
| ZONE DE DANGER                           |
+------------------------------------------+
| [Deconnecter toutes les sessions]        |
| [Exporter mes donnees]                   |
| [Supprimer mon compte] (rouge)           |
+------------------------------------------+
```

---

## Resume des Ajouts

1. **AvatarUpload**: Preview modal + suppression + specs affichees
2. **ProfileTab**: Card completion + zone danger + export donnees
3. **BillingTab**: Usage reel + trial indicator + connexion usePlan
4. **Settings.tsx**: Quick actions header + indicateur sauvegarde

Ces ameliorations rendront la page Parametres complete et professionnelle, comparable aux standards des grandes applications SaaS.
