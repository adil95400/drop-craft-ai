# Guide API Drop Craft AI

## Vue d'ensemble

L'API Drop Craft AI est construite sur Supabase avec des Edge Functions pour des opérations avancées. Cette documentation couvre tous les endpoints disponibles et leur utilisation.

## Base URL

- **Production**: `https://dtozyrmmekdnvekissuh.supabase.co`
- **Edge Functions**: `https://dtozyrmmekdnvekissuh.supabase.co/functions/v1`

## Authentification

Toutes les requêtes API nécessitent une authentification via JWT token.

```bash
Authorization: Bearer <jwt_token>
```

### Obtenir un token

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

const token = data.session?.access_token
```

## Endpoints API

### 1. Authentification

#### POST /auth/v1/signup
Créer un nouveau compte utilisateur.

```json
{
  "email": "user@example.com",
  "password": "password123",
  "data": {
    "full_name": "John Doe",
    "company": "Company Name"
  }
}
```

#### POST /auth/v1/token?grant_type=password
Connexion utilisateur.

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. Profil Utilisateur

#### GET /rest/v1/profiles
Récupérer le profil de l'utilisateur connecté.

#### PUT /rest/v1/profiles
Mettre à jour le profil utilisateur.

```json
{
  "full_name": "John Doe",
  "company": "New Company",
  "subscription_plan": "pro"
}
```

### 3. Produits

#### GET /rest/v1/products
Lister tous les produits.

**Paramètres de requête:**
- `limit`: Nombre de résultats (défaut: 20)
- `offset`: Décalage pour pagination
- `category`: Filtrer par catégorie
- `status`: Filtrer par statut (active, draft, archived)

#### POST /rest/v1/products
Créer un nouveau produit.

```json
{
  "title": "Nom du produit",
  "description": "Description du produit",
  "price": 29.99,
  "currency": "EUR",
  "category": "electronics",
  "images": ["url1", "url2"],
  "supplier_id": "uuid",
  "status": "active"
}
```

#### PUT /rest/v1/products?id=eq.{product_id}
Mettre à jour un produit existant.

#### DELETE /rest/v1/products?id=eq.{product_id}
Supprimer un produit.

### 4. Fournisseurs

#### GET /rest/v1/suppliers
Lister les fournisseurs.

#### POST /rest/v1/suppliers
Ajouter un nouveau fournisseur.

```json
{
  "name": "Nom du fournisseur",
  "platform": "aliexpress",
  "contact_email": "contact@supplier.com",
  "api_credentials": {},
  "status": "active"
}
```

### 5. Commandes

#### GET /rest/v1/orders
Lister les commandes.

#### POST /rest/v1/orders
Créer une nouvelle commande.

```json
{
  "customer_email": "customer@example.com",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "shipping_address": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "Paris",
    "postal_code": "75001",
    "country": "FR"
  },
  "total_amount": 59.98
}
```

### 6. Intégrations

#### GET /rest/v1/integrations
Lister les intégrations configurées.

#### POST /rest/v1/integrations
Configurer une nouvelle intégration.

```json
{
  "platform_type": "marketplace",
  "platform_name": "shopify",
  "credentials": {
    "shop_domain": "myshop.myshopify.com",
    "access_token": "token"
  },
  "sync_settings": {
    "auto_sync": true,
    "sync_frequency": "daily"
  }
}
```

## Edge Functions

### 1. Import de Produits

#### POST /functions/v1/import-products
Importer des produits depuis une plateforme externe.

```json
{
  "platform": "aliexpress",
  "urls": ["https://aliexpress.com/item/123"],
  "settings": {
    "markup_percentage": 50,
    "category": "electronics"
  }
}
```

### 2. Synchronisation

#### POST /functions/v1/sync-platform
Synchroniser avec une plateforme de vente.

```json
{
  "integration_id": "uuid",
  "sync_type": "products",
  "force_update": false
}
```

### 3. AI Assistant

#### POST /functions/v1/ai-assistant
Utiliser l'assistant AI pour diverses tâches.

```json
{
  "action": "optimize_product",
  "data": {
    "product_id": "uuid",
    "target_platform": "shopify"
  }
}
```

### 4. Analytics

#### GET /functions/v1/analytics
Récupérer les données d'analyse.

```json
{
  "period": "last_30_days",
  "metrics": ["revenue", "orders", "products"]
}
```

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 422 | Données de validation échouées |
| 429 | Trop de requêtes |
| 500 | Erreur serveur interne |

## Limitations de taux

- **Requêtes générales**: 1000 requêtes/heure/utilisateur
- **Edge Functions**: 100 requêtes/minute/utilisateur
- **Upload de fichiers**: 50 MB max par fichier

## Webhooks

### Configuration des webhooks

```json
{
  "url": "https://your-app.com/webhook",
  "events": ["order.created", "product.updated"],
  "secret": "your_webhook_secret"
}
```

### Événements disponibles

- `order.created`: Nouvelle commande créée
- `order.updated`: Commande mise à jour
- `product.created`: Nouveau produit ajouté
- `product.updated`: Produit mis à jour
- `integration.synced`: Synchronisation terminée

## SDK JavaScript

```javascript
import { DropCraftAPI } from '@dropcraft/api-sdk'

const api = new DropCraftAPI({
  apiKey: 'your_api_key',
  baseUrl: 'https://dtozyrmmekdnvekissuh.supabase.co'
})

// Utilisation
const products = await api.products.list()
const newProduct = await api.products.create({
  title: 'Nouveau produit',
  price: 29.99
})
```

## Exemples d'intégration

### React/Next.js

```javascript
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error) {
        setProducts(data)
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  return { products, loading }
}
```

### Python

```python
import requests

class DropCraftAPI:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def get_products(self, limit=20):
        response = requests.get(
            f'{self.base_url}/rest/v1/products',
            headers=self.headers,
            params={'limit': limit}
        )
        return response.json()
```

## Support

Pour toute question ou problème:
- Email: support@dropcraft.ai
- Documentation: https://docs.dropcraft.ai
- Status: https://status.dropcraft.ai