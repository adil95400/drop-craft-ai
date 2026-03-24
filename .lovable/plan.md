

## Plan : Activer les cron jobs d'automatisation

### Contexte
Les Edge Functions d'automatisation sont déployées mais aucun job `pg_cron` ne les appelle automatiquement. Le fichier temporaire `/tmp/setup-cron-jobs.sql` a été supprimé (stockage éphémère). Il faut recréer et exécuter le SQL.

### Ce qui sera fait

**Exécution SQL directe** (pas une migration, car contient des clés projet-spécifiques) pour planifier 8 cron jobs via `pg_cron` + `pg_net` :

| Job | Fréquence | Edge Function |
|-----|-----------|---------------|
| `webhook-retry` | Toutes les 2 min | `webhook-retry` |
| `automation-orchestrator` | Toutes les 10 min | `automation-orchestrator` (cycle complet) |
| `cart-recovery-every-15min` | Toutes les 15 min | `cart-recovery-cron` |
| `automation-alert-scan` | Toutes les 30 min | `automation-alert-engine` |
| `supplier-sync-cron` | Toutes les 15 min | `supplier-sync-cron` |
| `smart-inventory-cycle` | Toutes les 30 min | `smart-inventory-engine` |
| `pricing-rules-apply` | Toutes les 20 min | `pricing-rules-engine` |
| `security-engine-scan` | Toutes les 60 min | `automation-security-engine` |

Chaque job appellera sa Edge Function via `net.http_post` avec l'URL du projet et la clé anon pour l'authentification.

### Prérequis vérifiés
- Extensions `pg_cron` et `pg_net` (déjà utilisées dans le projet)
- Edge Functions déjà déployées

### Fichiers modifiés
- Aucun fichier du projet modifié
- Exécution SQL directe dans la base de données

