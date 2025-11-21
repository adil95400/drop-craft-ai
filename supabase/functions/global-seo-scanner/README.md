# Global SEO Scanner Edge Function

## Description

Fonction d'analyse et d'optimisation SEO pour pages web. Combine parsing HTML réel avec optimisation IA via Lovable AI Gateway.

## Actions disponibles

### 1. `scan` - Analyse SEO d'une page

Fetch la page HTML et analyse les éléments SEO critiques.

**Requête**:
```typescript
await supabase.functions.invoke('global-seo-scanner', {
  body: {
    action: 'scan',
    url: 'https://example.com/page'
  }
})
```

**Éléments analysés**:
- ✅ Balise `<title>` (longueur, présence)
- ✅ Meta description (longueur, présence)
- ✅ Balise H1 (unicité, présence)
- ✅ Longueur d'URL
- ✅ Structure HTML basique

**Réponse**:
```json
{
  "url": "https://example.com/page",
  "title": "Page Title",
  "metaDescription": "Page meta description",
  "h1": "Main Heading",
  "score": 85,
  "issues": [
    {
      "type": "Titre trop long",
      "severity": "warning",
      "message": "Le titre fait 65 caractères (max: 60)",
      "recommendation": "Réduisez la longueur du titre"
    }
  ]
}
```

**Scoring**:
- Score de base: 100
- Titre manquant: -20
- Titre trop long: -10
- Meta description manquante: -20
- Meta description trop longue: -10
- H1 manquant: -15
- URL trop longue: -5

### 2. `optimize` - Optimisation SEO avec IA

Génère des suggestions SEO optimisées via Lovable AI (Gemini 2.5 Flash).

**Configuration requise**:
```bash
LOVABLE_API_KEY=your_lovable_api_key
```

**Requête**:
```typescript
await supabase.functions.invoke('global-seo-scanner', {
  body: {
    action: 'optimize',
    url: 'https://example.com/page',
    language: 'fr',
    currentTitle: 'Current page title',
    currentDescription: 'Current meta description',
    currentH1: 'Current H1',
    issues: [/* issues from scan */]
  }
})
```

**Réponse**:
```json
{
  "optimized": {
    "title": "Titre optimisé SEO (50-60 chars)",
    "metaDescription": "Meta description optimisée avec keywords et CTA (150-160 chars)",
    "h1": "H1 optimisé avec keyword principal",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  }
}
```

**Fallback**: Si LOVABLE_API_KEY absent, retourne des suggestions génériques basées sur le type de page.

### 3. `generate_sitemap` - Génération de sitemap XML

Crée un sitemap XML standard pour SEO.

**Requête**:
```typescript
await supabase.functions.invoke('global-seo-scanner', {
  body: {
    action: 'generate_sitemap',
    pages: ['/'] ['/features', '/pricing', '/blog']
  }
})
```

**Réponse**:
```json
{
  "sitemap": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset>...</urlset>"
}
```

## Intégration Lovable AI

### Configuration

La fonction utilise l'API Gateway de Lovable pour l'optimisation IA :

- **Endpoint**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Model**: `google/gemini-2.5-flash`
- **Method**: Function calling avec tool `optimize_seo`

### Obtenir une clé API

1. Aller dans les paramètres de votre workspace Lovable
2. Section "API Keys"
3. Générer une nouvelle clé
4. Ajouter comme secret Supabase : `LOVABLE_API_KEY`

### Gestion des erreurs API

- **429 Rate Limit**: Retry après quelques secondes
- **402 Payment Required**: Crédits insuffisants
- **500 Internal**: Fallback vers mock

## Parsing HTML

La fonction fetch les pages en utilisant :

```typescript
const response = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; DropCraftBot/1.0)',
    'Accept': 'text/html'
  }
})
```

**Extraction**:
- `<title>` via regex: `/<title>(.*?)<\/title>/i`
- Meta description via: `/<meta\s+name="description"\s+content="(.*?)"/i`
- H1 via: `/<h1[^>]*>(.*?)<\/h1>/i`

**Limitations**:
- Ne supporte pas JavaScript rendering (SPAs)
- Limite à 1MB de HTML
- Timeout après 10 secondes

## Cas d'usage

### Workflow typique

```typescript
// 1. Scanner la page
const scanResult = await supabase.functions.invoke('global-seo-scanner', {
  body: { action: 'scan', url: pageUrl }
})

// 2. Optimiser si problèmes détectés
if (scanResult.data.score < 80) {
  const optimizeResult = await supabase.functions.invoke('global-seo-scanner', {
    body: {
      action: 'optimize',
      url: pageUrl,
      language: 'fr',
      currentTitle: scanResult.data.title,
      currentDescription: scanResult.data.metaDescription,
      currentH1: scanResult.data.h1,
      issues: scanResult.data.issues
    }
  })
  
  // 3. Appliquer les suggestions
  console.log('Suggestions:', optimizeResult.data.optimized)
}
```

### Batch scanning

```typescript
const urls = ['/home', '/products', '/about']
const results = await Promise.all(
  urls.map(url => 
    supabase.functions.invoke('global-seo-scanner', {
      body: { action: 'scan', url }
    })
  )
)
```

## Bonnes pratiques SEO

### Title
- **Longueur**: 50-60 caractères
- **Structure**: Keyword principal | Brand
- **Unique**: Chaque page doit avoir un titre différent

### Meta Description
- **Longueur**: 150-160 caractères
- **Contenu**: Keywords naturels + Call-to-action
- **Unique**: Éviter les duplications

### H1
- **Unicité**: Un seul H1 par page
- **Keyword**: Inclure le keyword principal
- **Clarté**: Décrire clairement le contenu

### URL
- **Longueur**: < 100 caractères
- **Structure**: kebab-case, descriptive
- **Éviter**: Paramètres inutiles, sessions

## Monitoring

### Vérifier les scans récents

```sql
SELECT 
  metadata->>'url' as url,
  metadata->>'score' as score,
  created_at
FROM activity_logs
WHERE action = 'seo_scan'
ORDER BY created_at DESC
LIMIT 20;
```

### Tracking des optimisations IA

```sql
SELECT 
  COUNT(*) as total_optimizations,
  AVG((metadata->>'score')::int) as avg_score_before,
  metadata->>'language' as language
FROM activity_logs
WHERE action = 'seo_optimize'
GROUP BY language;
```

## Limites et quotas

### Lovable AI
- **Rate limit**: 100 requêtes/minute
- **Coût**: ~0.001€ par optimisation (Gemini Flash)
- **Timeout**: 30 secondes max

### Fetch HTML
- **Timeout**: 10 secondes
- **Taille max**: 1 MB
- **Rate limit**: Respecter robots.txt

## Améliorations futures

- [ ] Support JavaScript rendering (Puppeteer)
- [ ] Analyse des images (alt text, compression)
- [ ] Vérification des liens cassés
- [ ] Analyse de la vitesse de chargement
- [ ] Détection de contenu dupliqué
- [ ] Suggestion de schema.org markup
- [ ] Analyse de la structure des URLs
- [ ] Vérification mobile-friendliness

## Ressources

- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Lovable AI Documentation](https://docs.lovable.dev/)
- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
