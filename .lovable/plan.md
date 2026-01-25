
# Plan d'amélioration de l'Extension ShopOpti+ vers 100% AutoDS

## Diagnostic des problèmes identifiés

### 1. Problème critique : Extension pas connectée au backend

L'extension ne peut pas importer de vraies données car il y a des **lacunes dans le flux de données** :

```text
┌─────────────────────────────────────────────────────────────────────┐
│  FLUX ACTUEL (INCOMPLET)                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. content.js extrait les données localement (OK)                 │
│                        ↓                                            │
│  2. Envoi via background.js → API backend (PROBLÈME)               │
│                        ↓                                            │
│  3. extension-scraper reçoit les données (OK si token présent)     │
│                        ↓                                            │
│  4. Insertion dans imported_products (OK)                          │
│                                                                     │
│  BLOCAGE: Pas de token d'authentification = échec silencieux       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Points faibles identifiés

| Composant | Problème | Impact |
|-----------|----------|--------|
| **Authentification** | Pas de flux OAuth/login dans l'extension | Utilisateur non authentifié = aucun import |
| **Token extensionToken** | Non généré/stocké dans chrome.storage | background.js échoue à `scrapeAndImport()` |
| **Extracteurs frontend** | Données extraites mais jamais envoyées au backend | Perte des données |
| **Synchronisation** | Pas de feedback temps réel | Utilisateur ne sait pas si ça marche |
| **Firecrawl** | API Key présente mais extraction client-side prioritaire | Extraction incomplète |

## Solution proposée

### Phase 1 : Système d'authentification extension (CRITIQUE)

**Créer un flux d'authentification extension complet :**

1. **Page de connexion dans l'extension (popup.html)**
   - Formulaire email/mot de passe ou bouton "Se connecter via shopopti.io"
   - Stocker le token JWT dans `chrome.storage.local`

2. **Edge Function `extension-auth`** (mise à jour)
   - Générer des tokens d'extension liés à l'utilisateur
   - Stocker dans la table `extension_auth_tokens`

3. **Indicateur de connexion visuel**
   - Badge vert "Connecté" / rouge "Non connecté" dans popup

### Phase 2 : Extraction haute fidélité côté serveur

**Améliorer `extension-scraper` pour exploiter Firecrawl à 100% :**

1. **Extraction complète Amazon**
   - Images haute résolution (SL1500)
   - Variantes (couleurs, tailles) avec prix
   - Vidéos produit (MP4/HLS)
   - Avis détaillés (pas juste le résumé)
   - Spécifications techniques

2. **Extraction AliExpress améliorée**
   - SKU variantes avec stock
   - Prix par variante
   - Vidéos fournisseur
   - Temps de livraison estimé

3. **Support Shopify stores**
   - API JSON `/products/*.json`
   - Métadonnées SEO
   - Tags et collections

### Phase 3 : Pipeline de données robuste

```text
┌──────────────────────────────────────────────────────────────────────┐
│  NOUVEAU FLUX COMPLET                                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Extension] Bouton Import cliqué                                   │
│         ↓                                                            │
│  [content.js] Extraction rapide (titre, prix, images basiques)     │
│         ↓                                                            │
│  [background.js] Vérifie token → Si absent, popup login             │
│         ↓                                                            │
│  [extension-scraper] Reçoit URL + token                             │
│         ↓                                                            │
│  [Firecrawl] Scraping haute fidélité (images HD, variantes, vidéos)│
│         ↓                                                            │
│  [Supabase] Insert imported_products + variants + reviews           │
│         ↓                                                            │
│  [Extension] Notification succès avec lien vers produit             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Phase 4 : Synchronisation temps réel

1. **WebSocket ou polling** pour suivi d'import
2. **Badge dynamique** avec compteur de produits
3. **Historique d'imports** accessible dans popup

## Modifications techniques détaillées

### Fichiers à créer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `popup.html` | Modifier | Ajouter formulaire login + indicateur connexion |
| `popup.js` | Modifier | Logique d'authentification + stockage token |
| `background.js` | Modifier | Vérification token avant chaque appel API |
| `supabase/functions/extension-auth/index.ts` | Créer/Modifier | Endpoint login extension |
| `content.js` | Modifier | Envoyer données extraites au backend (pas juste local) |
| `extractors/*.js` | Améliorer | Extraction plus complète des variantes et médias |

### Schéma base de données

La table `extension_auth_tokens` existe déjà. Vérifier qu'elle contient :
- `token` (string, unique)
- `user_id` (uuid, FK users)
- `is_active` (boolean)
- `expires_at` (timestamp)
- `last_used_at` (timestamp)

### Comparaison AutoDS vs ShopOpti+ après implémentation

| Fonctionnalité | AutoDS | ShopOpti+ Actuel | ShopOpti+ Après |
|----------------|--------|------------------|-----------------|
| Import 1-clic | ✅ | ⚠️ Bouton existe, backend non connecté | ✅ |
| Extraction images HD | ✅ | ⚠️ Partiel | ✅ |
| Extraction variantes | ✅ | ⚠️ Partiel | ✅ |
| Extraction vidéos | ✅ | ❌ | ✅ |
| Import avis détaillés | ✅ | ❌ | ✅ |
| Multi-store sync | ✅ | ⚠️ UI existe | ✅ |
| Auto-Order | ✅ | ⚠️ UI existe | ✅ |
| Ads Spy | ✅ | ⚠️ Mock data | ✅ |
| Authentification extension | ✅ | ❌ MANQUANT | ✅ |

## Résumé de l'implémentation

1. **Priorité 1** : Flux d'authentification extension (sans ça, rien ne marche)
2. **Priorité 2** : Connecter `content.js` extracteurs → backend via token
3. **Priorité 3** : Améliorer extraction Firecrawl (images HD, variantes, vidéos)
4. **Priorité 4** : Feedback utilisateur en temps réel (notifications, badges)

Cette implémentation permettra d'atteindre **100% de parité avec AutoDS** avec un flux de données complet et fiable.
