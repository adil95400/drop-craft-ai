# API Reference - Extension Gateway v2.1

## Vue d'ensemble

L'Extension Gateway est le point d'entrée unique pour toutes les communications entre l'extension Chrome et le backend ShopOpti+.

### URL de base
```
POST /functions/v1/extension-gateway
```

### Headers requis

| Header | Description | Obligatoire |
|--------|-------------|-------------|
| `Authorization` | Bearer token JWT | Oui* |
| `X-Extension-Id` | ID unique de l'extension | Oui |
| `X-Extension-Version` | Version de l'extension (ex: 6.0.0) | Oui |
| `X-Request-Id` | UUID unique pour anti-replay | Oui |
| `X-Idempotency-Key` | Clé pour opérations d'écriture | Pour write ops |
| `Content-Type` | `application/json` | Oui |

*Sauf pour les actions publiques (CHECK_VERSION, HEALTHCHECK)

---

## Actions disponibles

### 🔐 Authentification

#### AUTH_GENERATE_TOKEN
Génère un token d'accès pour l'extension.

```json
{
  "action": "AUTH_GENERATE_TOKEN",
  "payload": {
    "email": "user@example.com",
    "password": "********"
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "expiresAt": "2026-02-12T10:00:00Z",
    "permissions": ["products:import", "ai:optimize"]
  }
}
```

#### AUTH_VALIDATE_TOKEN
Valide un token existant.

```json
{
  "action": "AUTH_VALIDATE_TOKEN",
  "payload": {}
}
```

#### AUTH_HEARTBEAT
Maintient la session active et récupère les quotas.

```json
{
  "action": "AUTH_HEARTBEAT",
  "payload": {}
}
```

---

### 📦 Import de produits

#### IMPORT_PRODUCT
Import d'un produit unique avec toutes les données.

```json
{
  "action": "IMPORT_PRODUCT",
  "payload": {
    "url": "https://aliexpress.com/item/123.html",
    "options": {
      "importReviews": true,
      "importVideos": true,
      "autoEnrichSeo": true,
      "targetCategory": "Electronics"
    }
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "title": "Product Title",
    "status": "imported",
    "variants": 5,
    "images": 8,
    "reviews": 45,
    "seo": {
      "title": "Optimized Title",
      "description": "SEO optimized description..."
    }
  }
}
```

#### IMPORT_BULK
Import de plusieurs produits en lot.

```json
{
  "action": "IMPORT_BULK",
  "payload": {
    "urls": [
      "https://aliexpress.com/item/123.html",
      "https://aliexpress.com/item/456.html"
    ],
    "options": {
      "autoEnrichSeo": true,
      "priceMultiplier": 2.5
    }
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "jobId": "bulk-job-uuid",
    "total": 2,
    "queued": 2,
    "status": "processing"
  }
}
```

#### IMPORT_REVIEWS
Import des avis pour un produit existant.

```json
{
  "action": "IMPORT_REVIEWS",
  "payload": {
    "productId": "product-uuid",
    "sourceUrl": "https://aliexpress.com/item/123.html",
    "options": {
      "maxReviews": 100,
      "minRating": 4,
      "translateTo": "fr"
    }
  }
}
```

---

### 🤖 Optimisation IA

#### AI_OPTIMIZE_FULL
Optimisation complète d'un produit (titre, description, SEO).

```json
{
  "action": "AI_OPTIMIZE_FULL",
  "payload": {
    "productId": "product-uuid",
    "language": "fr",
    "tone": "professional",
    "targetMarket": "France"
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "title": {
      "original": "Original Title",
      "optimized": "Titre Optimisé pour SEO"
    },
    "description": {
      "original": "...",
      "optimized": "Description enrichie avec mots-clés..."
    },
    "seo": {
      "metaTitle": "Meta Title (60 chars)",
      "metaDescription": "Meta description (160 chars)...",
      "keywords": ["keyword1", "keyword2"]
    },
    "tags": ["tag1", "tag2", "tag3"]
  }
}
```

#### AI_GENERATE_SEO
Génération SEO uniquement.

```json
{
  "action": "AI_GENERATE_SEO",
  "payload": {
    "title": "Product Title",
    "description": "Product description...",
    "category": "Electronics",
    "language": "fr"
  }
}
```

---

### 🔄 Synchronisation

#### SYNC_STOCK
Synchronise le stock avec la source.

```json
{
  "action": "SYNC_STOCK",
  "payload": {
    "productIds": ["uuid1", "uuid2"],
    "sourceType": "aliexpress"
  }
}
```

#### SYNC_PRICE
Synchronise les prix avec la source.

```json
{
  "action": "SYNC_PRICE",
  "payload": {
    "productIds": ["uuid1", "uuid2"],
    "applyMargin": true,
    "marginPercent": 30
  }
}
```

---

### 🔧 Utilitaires

#### CHECK_VERSION
Vérifie si une mise à jour est disponible.

```json
{
  "action": "CHECK_VERSION",
  "payload": {
    "currentVersion": "5.8.1"
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "currentVersion": "5.8.1",
    "latestVersion": "5.9.0",
    "updateRequired": false,
    "updateAvailable": true,
    "releaseNotes": "Bug fixes and improvements"
  }
}
```

#### GET_IMPORT_JOB
Récupère le statut d'un job d'import.

```json
{
  "action": "GET_IMPORT_JOB",
  "payload": {
    "jobId": "job-uuid"
  }
}
```

#### HEALTHCHECK
Vérifie l'état du gateway.

```json
{
  "action": "HEALTHCHECK",
  "payload": {}
}
```

---

## Codes d'erreur

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Token manquant ou invalide |
| `INVALID_TOKEN` | 401 | Token expiré ou corrompu |
| `FORBIDDEN_SCOPE` | 403 | Permissions insuffisantes |
| `INVALID_PAYLOAD` | 400 | Payload mal formé |
| `UNKNOWN_ACTION` | 400 | Action non reconnue |
| `REPLAY_DETECTED` | 409 | Requête déjà traitée |
| `IN_PROGRESS` | 409 | Opération déjà en cours |
| `QUOTA_EXCEEDED` | 429 | Limite de requêtes atteinte |
| `IMPORT_FAILED` | 500 | Échec de l'import |
| `SCRAPE_FAILED` | 502 | Échec de l'extraction |

### Format d'erreur

```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 50,
      "remaining": 0,
      "resetAt": "2026-02-05T11:00:00Z"
    }
  }
}
```

---

## Rate Limiting

Les limites varient selon l'action et le plan utilisateur :

| Action | Free | Pro | Business |
|--------|------|-----|----------|
| IMPORT_PRODUCT | 10/h | 50/h | 200/h |
| IMPORT_BULK | 2/h | 10/h | 50/h |
| AI_OPTIMIZE_* | 10/h | 30/h | 100/h |
| SYNC_* | 5/h | 20/h | 100/h |

---

## Sécurité

### Anti-Replay
Chaque requête doit inclure un `X-Request-Id` unique. Les IDs sont stockés 30 jours.

### Idempotence
Les opérations d'écriture nécessitent un `X-Idempotency-Key` pour éviter les doublons.

### Validation
Tous les payloads sont validés via Zod schemas avant traitement.

---

## Exemples complets

### Import produit avec curl

```bash
curl -X POST \
  https://api.shopopti.com/functions/v1/extension-gateway \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Extension-Id: shopopti-chrome-extension" \
  -H "X-Extension-Version: 5.8.1" \
  -H "X-Request-Id: $(uuidgen)" \
  -H "X-Idempotency-Key: import-$(date +%s)" \
  -d '{
    "action": "IMPORT_PRODUCT",
    "payload": {
      "url": "https://aliexpress.com/item/123.html",
      "options": {
        "importReviews": true,
        "autoEnrichSeo": true
      }
    }
  }'
```

### Import avec JavaScript

```javascript
const response = await fetch('/functions/v1/extension-gateway', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Extension-Id': 'shopopti-chrome-extension',
    'X-Extension-Version': '5.8.1',
    'X-Request-Id': crypto.randomUUID(),
    'X-Idempotency-Key': `import-${Date.now()}`
  },
  body: JSON.stringify({
    action: 'IMPORT_PRODUCT',
    payload: {
      url: 'https://aliexpress.com/item/123.html',
      options: { importReviews: true }
    }
  })
});

const result = await response.json();
```

---

**Version API** : 2.1.0  
**Dernière mise à jour** : Février 2026
