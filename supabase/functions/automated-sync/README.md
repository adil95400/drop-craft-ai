# Automated Sync Edge Function

## Description

Cette fonction gère la synchronisation automatique des données entre les fournisseurs (suppliers) et la base de données. Elle traite différents types de synchronisation via un système de queue de jobs.

## Types de synchronisation supportés

1. **`supplier_api`** - Synchronisation complète des produits depuis les APIs fournisseurs
2. **`inventory_update`** - Mise à jour des stocks uniquement
3. **`price_update`** - Mise à jour des prix uniquement
4. **`order_sync`** - Synchronisation des statuts de commandes

## Architecture

### Flux de traitement

```
[Scheduler/Cron] → [automated-sync] → [Process Jobs] → [Update DB]
                                     ↓
                               [Maintenance Tasks]
```

### Connecteurs fournisseurs requis

La fonction s'appuie sur les connecteurs suivants pour interroger les APIs :

- **BigBuy** : `/functions/bigbuy-integration`
- **AliExpress** : `/functions/aliexpress-integration`
- Autres fournisseurs à ajouter selon les besoins

## Configuration requise

### Secrets Supabase

Aucun secret spécifique requis pour cette fonction, mais les connecteurs sous-jacents nécessitent :

- `BIGBUY_API_KEY` - pour BigBuy
- `ALIEXPRESS_API_KEY`, `ALIEXPRESS_API_SECRET` - pour AliExpress

### Tables de base de données

- `import_jobs` - Queue de jobs de synchronisation
- `suppliers` - Fournisseurs configurés par utilisateur
- `imported_products` - Produits importés
- `orders` - Commandes à synchroniser
- `marketplace_integrations` - Intégrations marketplace (pour sync bidirectionnelle)

## Utilisation

### Déclenchement manuel

```typescript
const { data, error } = await supabase.functions.invoke('automated-sync')
```

### Déclenchement automatique via Cron

Configurer un job pg_cron dans Supabase :

```sql
SELECT cron.schedule(
  'automated-sync-every-hour',
  '0 * * * *', -- Toutes les heures
  $$
  SELECT net.http_post(
    url := 'https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/automated-sync',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

## Workflow de synchronisation

1. **Récupération des jobs** : Sélectionne les jobs en attente (status = 'pending')
2. **Traitement séquentiel** : Chaque job est traité selon son type
3. **Mise à jour des statuts** : 'running' → 'completed' ou 'failed'
4. **Maintenance** : Nettoyage des logs et calcul des scores de performance

## Tâches de maintenance

Exécutées après chaque cycle de synchronisation :

- Suppression des logs de plus de 30 jours
- Suppression des jobs terminés de plus de 7 jours
- Calcul des scores de performance produits (ai_score)

## Intégration avec les connecteurs

### Exemple d'intégration BigBuy

```typescript
// Dans processSupplierSync
const { data: products } = await supabase.functions.invoke('bigbuy-integration', {
  body: {
    action: 'fetch_products',
    supplier_id: supplier.id,
    limit: 100
  }
})
```

### Exemple d'intégration AliExpress

```typescript
const { data: products } = await supabase.functions.invoke('aliexpress-integration', {
  body: {
    action: 'search_products',
    keywords: supplier.search_keywords,
    limit: 50
  }
})
```

## Logging

Tous les logs sont préfixés avec des emojis pour faciliter le debugging :

- 🔄 Démarrage de processus
- 📋 Information générale
- 🚀 Traitement de job
- ✅ Succès
- ❌ Erreur
- 🧹 Maintenance
- 📦 Inventaire
- 💰 Prix

## Gestion des erreurs

- Les erreurs au niveau job sont enregistrées dans `import_jobs.errors`
- Le statut du job passe à 'failed'
- Les autres jobs continuent à être traités
- Les erreurs critiques retournent un status 500

## Amélirations futures

- [ ] Remplacer `generateMockProducts` par vraies APIs
- [ ] Ajouter support pour plus de fournisseurs
- [ ] Implémenter retry logic avec backoff exponentiel
- [ ] Ajouter métriques de performance (temps d'exécution, taux de succès)
- [ ] Implémenter un système de priorités pour les jobs
- [ ] Ajouter des webhooks pour notifier l'utilisateur en fin de sync

## Monitoring

### Vérifier les jobs en cours

```sql
SELECT * FROM import_jobs 
WHERE status = 'running' 
ORDER BY started_at DESC;
```

### Statistiques de synchronisation

```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM import_jobs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```
