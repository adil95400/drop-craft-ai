
# Plan de Synchronisation Extension Chrome - Production shopopti.io

## Contexte

Vos domaines sont maintenant configurés et **Live** :
- `drop-craft-ai.lovable.app` ✅
- `shopopti.io` ✅ (domaine principal)
- `www.shopopti.io` ✅

Tous les fichiers de l'extension utilisent déjà `https://shopopti.io` comme `APP_URL` et le bon endpoint API backend. Cependant, il y a quelques incohérences de version à corriger pour garantir une synchronisation parfaite.

## Étapes du Plan

### Étape 1 : Harmonisation des Versions

Mettre à jour tous les fichiers de l'extension pour utiliser une version cohérente **v5.6.6** :

**Fichiers à modifier :**
- `public/chrome-extension/manifest.json` - Déjà v5.6.4 → v5.6.6
- `public/chrome-extension/background.js` - v5.6.2 → v5.6.6
- `public/chrome-extension/popup.js` - v5.6.2 → v5.6.6
- `public/chrome-extension/content-script.js` - v5.6.3 → v5.6.6
- `public/chrome-extension/lib/config.js` - v5.6.0 → v5.6.6
- `public/chrome-extension/options.js` - v4.3.16 → v5.6.6
- `public/chrome-extension/import-overlay-v2.js` - v5.6.0 → v5.6.6
- `public/chrome-extension/bulk-import-v5.js` - v5.6.0 → v5.6.6
- `src/utils/extensionZipGenerator.ts` - v5.6.4 → v5.6.6

### Étape 2 : Vérification du manifest.json

Confirmer que le Content Security Policy permet les connexions vers :
- `https://*.supabase.co` (API backend)
- `https://shopopti.io` (application web)

Le manifest actuel est correct :
```text
"content_security_policy": {
  "extension_pages": "...connect-src 'self' https://*.supabase.co https://shopopti.io https://*.shopopti.io..."
}
```

### Étape 3 : Mise à jour du Générateur ZIP

Modifier `extensionZipGenerator.ts` pour :
- Mettre à jour la version à **5.6.6**
- S'assurer que tous les fichiers critiques sont inclus
- Générer des logs de téléchargement clairs

### Étape 4 : Publication sur shopopti.io

Une fois les modifications effectuées :
1. Aller dans les paramètres du projet
2. Cliquer sur **Publish** pour déployer sur le domaine `shopopti.io`
3. Vérifier que `https://shopopti.io/extensions/chrome` est accessible
4. Télécharger le nouveau ZIP v5.6.6
5. Réinstaller l'extension avec "Load unpacked" depuis le nouveau dossier extrait

---

## Section Technique

### Modifications de Code

**1. manifest.json**
```javascript
"version": "5.6.6"
```

**2. background.js (ligne 10)**
```javascript
const VERSION = '5.6.6';
```

**3. popup.js (ligne 10)**
```javascript
this.VERSION = '5.6.6';
```

**4. content-script.js (ligne 9)**
```javascript
const VERSION = '5.6.6';
```

**5. lib/config.js (ligne 8)**
```javascript
VERSION: '5.6.6',
```

**6. options.js (ligne 5)**
```javascript
const VERSION = '5.6.6';
```

**7. import-overlay-v2.js (ligne 16)**
```javascript
VERSION: '5.6.6'
```

**8. bulk-import-v5.js (ligne 17)**
```javascript
const CONFIG = {
  VERSION: '5.6.6',
  ...
}
```

**9. extensionZipGenerator.ts (ligne 6)**
```typescript
const EXTENSION_VERSION = '5.6.6';
```

### Vérification Post-Déploiement

Après publication, tester :
1. Accès à `https://shopopti.io/extensions/chrome`
2. Téléchargement du ZIP
3. Contenu du ZIP (doit inclure tous les 90+ fichiers)
4. Installation dans Chrome via "Load unpacked"
5. Boutons d'import sur Amazon/AliExpress/Temu

### URLs de Configuration Actuelles (déjà correctes)

| Constante | Valeur |
|-----------|--------|
| `APP_URL` | `https://shopopti.io` |
| `API_URL` | `https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1` |
| `ALLOWED_API_DOMAINS` | `['supabase.co', 'shopopti.io']` |

Ces valeurs sont correctes et ne nécessitent aucune modification.
