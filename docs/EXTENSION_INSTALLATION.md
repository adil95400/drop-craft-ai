# Guide d'Installation de l'Extension Chrome ShopOpti+

## Prérequis

- Google Chrome version 88 ou supérieure
- Un compte ShopOpti+ actif
- Connexion internet stable

## Installation

### Méthode 1 : Installation depuis le SaaS (Recommandée)

1. **Connectez-vous** à votre compte ShopOpti+ sur [app.shopopti.com](https://app.shopopti.com)
2. Naviguez vers **Extensions** → **Chrome Extension**
3. Cliquez sur **Télécharger l'extension**
4. Un fichier `.zip` sera téléchargé

### Méthode 2 : Installation manuelle

1. Téléchargez le dossier de l'extension depuis le projet
2. Décompressez le fichier `.zip`

## Configuration dans Chrome

### Étape 1 : Ouvrir le gestionnaire d'extensions

1. Ouvrez Chrome
2. Tapez `chrome://extensions` dans la barre d'adresse
3. Appuyez sur **Entrée**

### Étape 2 : Activer le mode développeur

1. En haut à droite, activez le toggle **Mode développeur**
2. De nouveaux boutons apparaîtront

### Étape 3 : Charger l'extension

1. Cliquez sur **Charger l'extension non empaquetée**
2. Sélectionnez le dossier `chrome-extension` décompressé
3. L'extension apparaîtra dans la liste

### Étape 4 : Connexion

1. Cliquez sur l'icône ShopOpti+ dans la barre d'outils Chrome
2. Entrez vos identifiants ShopOpti+
3. Cliquez sur **Se connecter**

## Utilisation

### Importer un produit

1. **Naviguez** vers une page produit sur un site supporté :
   - AliExpress
   - Amazon
   - CJ Dropshipping
   - Temu
   - Et plus...

2. **Cliquez** sur l'icône ShopOpti+ ou utilisez le raccourci `Ctrl+Shift+I`

3. **Options d'import** :
   - ✅ Importer les images
   - ✅ Importer les variantes
   - ✅ Importer les avis
   - ✅ Générer SEO automatiquement

4. **Confirmez** l'import en cliquant sur **Importer**

### Import en masse

1. Ouvrez plusieurs onglets de produits
2. Cliquez sur l'icône ShopOpti+ → **Import en masse**
3. Sélectionnez les produits à importer
4. Configurez les options globales
5. Lancez l'import

## Plateformes Supportées

| Plateforme | Import Produit | Import Avis | Import Vidéos |
|------------|----------------|-------------|---------------|
| AliExpress | ✅ | ✅ | ✅ |
| Amazon | ✅ | ⚠️ Limité | ❌ |
| CJ Dropshipping | ✅ | ✅ | ✅ |
| Temu | ✅ | ⚠️ Limité | ❌ |
| 1688 | ✅ | ❌ | ❌ |
| Alibaba | ✅ | ✅ | ✅ |

## Résolution des Problèmes

### L'extension ne se charge pas

1. Vérifiez que le **Mode développeur** est activé
2. Supprimez l'extension et rechargez-la
3. Vérifiez la console des erreurs (`chrome://extensions` → Détails → Erreurs)

### Erreur "Fichiers introuvables"

Assurez-vous que la structure du dossier est correcte :
```
chrome-extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   └── popup.js
├── lib/
│   ├── backend-import-client.js
│   ├── import-response-handler.js
│   └── backend-first-import.js
└── ...
```

### Erreur de connexion

1. Vérifiez votre connexion internet
2. Assurez-vous d'être connecté au SaaS
3. Régénérez le token : Menu → **Reconnecter**

### Produit non importé

1. Vérifiez que la page produit est complète
2. Attendez le chargement complet de la page
3. Consultez les logs : Extension → **Historique**

## Mises à jour

L'extension vérifie automatiquement les mises à jour. Si une nouvelle version est disponible :

1. Une notification apparaîtra
2. Cliquez sur **Mettre à jour**
3. L'extension se rechargera automatiquement

### Mise à jour manuelle

1. Téléchargez la nouvelle version depuis le SaaS
2. Remplacez les fichiers dans le dossier existant
3. Allez dans `chrome://extensions`
4. Cliquez sur l'icône **Actualiser** de l'extension

## Support

- **Documentation** : [docs.shopopti.com](https://docs.shopopti.com)
- **Email** : support@shopopti.com
- **Chat** : Disponible dans le SaaS (coin inférieur droit)

## FAQ

### Combien de produits puis-je importer ?

Selon votre plan :
- **Free** : 10 produits/mois
- **Pro** : 500 produits/mois
- **Business** : Illimité

### Les avis importés sont-ils authentiques ?

Les avis sont importés depuis les plateformes sources. Vous pouvez les modérer dans le SaaS avant publication.

### Puis-je personnaliser les descriptions pendant l'import ?

Oui ! Activez l'option **SEO Automatique** pour générer des descriptions optimisées avec l'IA.

---

**Version actuelle** : 6.0.0  
**Dernière mise à jour** : Février 2026
