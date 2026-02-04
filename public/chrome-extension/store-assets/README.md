# Chrome Web Store Assets - ShopOpti+ v5.8.1

## Screenshots (1280x800)

| Fichier | Description |
|---------|-------------|
| `screenshot-1-popup.png` | Interface popup avec statistiques et actions rapides |
| `screenshot-2-import-button.png` | Page produit Amazon avec bouton d'import visible |
| `screenshot-3-preview.png` | Modal de prévisualisation avec score qualité |

## Images Promotionnelles

| Fichier | Dimensions | Utilisation |
|---------|------------|-------------|
| `promo-tile-small-440x280.png` | 440×280 | Small Tile (requise) |
| `promo-tile-large-920x680.png` | 920×680 | Large Tile (recommandée) |
| `promo-marquee-1400x560.png` | 1400×560 | Marquee Banner (optionnelle) |

## Instructions de Soumission

### 1. Accéder au Chrome Developer Dashboard
```
https://chrome.google.com/webstore/devconsole
```

### 2. Informations à renseigner

| Champ | Valeur |
|-------|--------|
| Nom | ShopOpti+ \| Dropshipping Pro |
| Description courte | Extension Dropshipping Pro - Import 1-Click produits & avis, monitoring prix, auto-order. 45+ plateformes. 🚀 |
| Catégorie | Shopping |
| Langue | Français |

### 3. Justification des permissions

| Permission | Justification |
|------------|---------------|
| `activeTab` | Accès à l'onglet actif pour extraire les données produit lors de l'import |
| `storage` | Sauvegarder les préférences utilisateur et les tokens d'authentification localement |
| `alarms` | Planifier les vérifications automatiques de prix et de stock |
| `notifications` | Alerter l'utilisateur des changements de prix ou de disponibilité |

### 4. URLs requises

- **Site web**: https://shopopti.io
- **Politique de confidentialité**: https://drop-craft-ai.lovable.app/privacy
- **Email support**: support@shopopti.io

## Après Approbation

1. Récupérer l'ID de l'extension (format: `abcdefghijklmnop`)
2. Mettre à jour `CHROME_STORE_URL` dans `src/pages/extensions/ChromeExtensionPage.tsx`
3. Passer `IS_PUBLISHED` à `true`
4. Republier l'application

---

Généré automatiquement pour ShopOpti+ v5.8.1
