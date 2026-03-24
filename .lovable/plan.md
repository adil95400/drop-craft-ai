

# Plan : Compléter le système d'automatisation — Lacunes restantes

## Contexte

L'infrastructure d'automatisation est largement en place :
- **Orchestrateur** : `automation-orchestrator` fonctionne (séquence complète)
- **Polling client** : `useAutomationPolling` actif dans le layout
- **Trigger externe** : `external-cron-trigger` déployé avec authentification `CRON_SECRET`
- **Edge Functions critiques** : `supplier-sync-cron`, `auto-reorder-engine`, `pricing-rules-engine`, `smart-inventory-engine`, `workflow-executor`, `cart-recovery-cron`, `automation-alert-engine`, `automation-security-engine` — tous déployés

## Lacunes identifiées

### 1. `webhook-retry` n'existe pas
Référencé par le polling et le cron externe mais le dossier est vide. Le polling échouera silencieusement toutes les 2 minutes.

### 2. Le pricing-rules-engine ne supporte pas `apply_all`
L'orchestrateur envoie `{ action: 'apply_all' }` mais la fonction attend `{ userId, productId, currentPrice, costPrice }` — elle ne traite qu'un produit à la fois, pas un batch automatique.

### 3. Pas de dashboard de monitoring du polling
Aucune visibilité sur la santé des jobs polling (dernière exécution réussie, erreurs, latence).

---

## Implémentation

### Etape 1 : Créer `webhook-retry` Edge Function
- Lit les `webhook_events` en status `failed` avec `retry_count < 5`
- Retry avec backoff exponentiel via `webhook-delivery`
- Met à jour le statut après réussite/échec définitif

### Etape 2 : Ajouter le mode batch à `pricing-rules-engine`
- Supporter `{ action: 'apply_all' }` : itérer sur tous les produits de tous les utilisateurs ayant des règles actives
- Appliquer les règles par priorité, logger dans `price_change_history`
- Garder la compatibilité avec le mode single-product existant

### Etape 3 : Ajouter un panneau "Automation Health" au Control Center
- Afficher le statut de chaque sous-système (dernière exécution, succès/erreur)
- Basé sur les `activity_logs` existants filtrés par source
- Bouton refresh individuel par sous-système

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `supabase/functions/webhook-retry/index.ts` | Créer |
| `supabase/functions/pricing-rules-engine/index.ts` | Modifier (ajouter mode batch) |
| `src/pages/automation/AutomationControlCenter.tsx` | Modifier (ajouter panneau santé) |

## Estimation
3 fichiers, complexité modérée. Aucune migration de base de données nécessaire — les tables `webhook_events`, `pricing_rules`, `price_change_history` et `activity_logs` existent déjà.

