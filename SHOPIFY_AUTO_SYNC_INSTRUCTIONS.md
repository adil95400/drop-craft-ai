# Configuration de la Synchronisation Automatique Shopify

## ✅ Ce qui a été mis en place

### 1. Synchronisation Manuelle
- Un bouton "Sync Shopify" a été ajouté sur la page des produits importés
- Cliquez dessus pour synchroniser immédiatement vos produits Shopify

### 2. Edge Function Auto-Sync
- Une nouvelle fonction `shopify-auto-sync` a été créée
- Elle synchronise automatiquement tous les magasins Shopify actifs
- Elle est optimisée pour gérer plusieurs boutiques simultanément

## 🔧 Configuration du Cron Job (Sync Automatique)

Pour activer la synchronisation automatique toutes les heures, suivez ces étapes :

### Étape 1 : Accédez à SQL Editor
Ouvrez le SQL Editor de votre projet Supabase :
https://supabase.com/dashboard/project/dtozyrmmekdnvekissuh/sql/new

### Étape 2 : Exécutez cette requête SQL

```sql
-- Créer le cron job pour synchroniser automatiquement les produits Shopify toutes les heures
SELECT cron.schedule(
  'shopify-hourly-sync',
  '0 * * * *', -- Toutes les heures à H:00
  $$
  SELECT
    net.http_post(
        url:='https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/shopify-auto-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb
    ) as request_id;
  $$
);
```

### Étape 3 : Vérifier que le cron job est créé

```sql
-- Vérifier les cron jobs actifs
SELECT * FROM cron.job WHERE jobname = 'shopify-hourly-sync';
```

## 📋 Options de Planification

Vous pouvez modifier la fréquence de synchronisation en changeant le pattern cron :

| Fréquence | Pattern Cron | Description |
|-----------|-------------|-------------|
| Toutes les heures | `0 * * * *` | À la minute 0 de chaque heure |
| Toutes les 2 heures | `0 */2 * * *` | Toutes les 2 heures |
| Toutes les 6 heures | `0 */6 * * *` | 4 fois par jour |
| Une fois par jour | `0 2 * * *` | Tous les jours à 2h du matin |
| Deux fois par jour | `0 2,14 * * *` | À 2h et 14h |

## 🧪 Test Manuel

Pour tester la synchronisation automatique immédiatement :

```sql
-- Appeler manuellement la fonction de sync auto
SELECT net.http_post(
    url:='https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/shopify-auto-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb
) as request_id;
```

## 📊 Monitoring

Pour voir l'historique des synchronisations :

```sql
-- Voir les dernières synchronisations
SELECT 
  user_id,
  last_sync_at,
  product_count,
  connection_status
FROM store_integrations 
WHERE platform = 'shopify'
ORDER BY last_sync_at DESC;
```

## 🔴 Désactiver le Cron Job

Si vous voulez arrêter la synchronisation automatique :

```sql
-- Supprimer le cron job
SELECT cron.unschedule('shopify-hourly-sync');
```

## ✨ Logs de la Fonction

Pour voir les logs de la fonction auto-sync :
https://supabase.com/dashboard/project/dtozyrmmekdnvekissuh/functions/shopify-auto-sync/logs

---

**Note** : La synchronisation automatique synchronise TOUTES les boutiques Shopify actives dans votre base de données. Chaque boutique sera synchronisée indépendamment.
