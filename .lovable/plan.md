

## Plan : Activer le cron job pg_cron pour la récupération de paniers abandonnés

### Contexte
La Edge Function `cart-recovery-cron` est déployée mais aucun job pg_cron n'existe pour l'appeler automatiquement. Le projet utilise déjà pg_cron + pg_net pour d'autres tâches (sync fournisseurs, monitoring prix, etc.).

### Implémentation

**Migration SQL** — Créer un cron job `cart-recovery-every-15min` qui appelle la Edge Function toutes les 15 minutes via `net.http_post` :

```sql
SELECT cron.schedule(
  'cart-recovery-every-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1/cart-recovery-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Fichier modifié
- **1 migration SQL** : planification du cron job toutes les 15 minutes

### Résultat
- Détection automatique des paniers abandonnés (>1h) toutes les 15 minutes
- Envoi automatique d'emails Brevo + notifications push Firebase
- Mise à jour du statut et compteur de tentatives (max 3)

