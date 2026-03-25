

# Plan d'industrialisation Drop-Craft AI — Parité concurrents

## Verdict du rapport (résumé)

Le front-end est riche mais le back-end a 3 problemes structurants :
1. **Incohérences de schema** : tables/workflows dupliqués, Edge Functions qui référencent des tables supprimées
2. **Securité multi-tenant** : service_role + userId dans le body = risque cross-tenant
3. **Pas de surveillance continue réelle** : monitoring concurrentiel partiellement simulé, orchestration batch et non event-driven

## Ce qui manque pour la parité (par priorité)

### P0 — Sécurisation + Stabilisation (bloquant)

**1. Sécuriser les Edge Functions cron/internes**
- Ajouter vérification `CRON_SECRET` sur toutes les fonctions internes (supplier-sync-cron, auto-reorder-engine, smart-inventory-engine, pricing-rules-engine)
- Supprimer `userId` du body — extraire depuis JWT pour les fonctions user-facing
- Restreindre CORS sur les fonctions internes

**2. Aligner schéma DB ↔ Edge Functions**
- Corriger `workflow-executor` qui écrit dans `automation_executions` (table supprimée)
- Unifier `repricing_rules` vs `pricing_rules` → un seul modèle canonique
- Consolider les 3 systèmes de workflows en 1 seul (automation_workflows + workflow_templates + saved_workflows)

### P1 — MVP opérationnel

**3. Auto-reorder + tracking production-safe**
- Scoper par JWT (plus de userId body)
- Ajouter idempotency key (supplier_id + sku + day + qty)
- Job de réconciliation pour les cas de désynchronisation

**4. Moteur de pricing unifié + P&L**
- Fusionner pricing-rules-engine + cross-module-sync repricing en un seul pipeline
- Ajouter calcul marge nette (cost + fees + shipping + ads)
- Confidence scoring avant auto-apply
- Historique cohérent dans une seule table

**5. Ingestion fournisseur via API réelle (1-2 connecteurs)**
- Implémenter un vrai pull API sur CJ Dropshipping ou BigBuy (les 2 déjà câblés dans auto-reorder)
- Remplacer le fallback simulé du competitor-tracker par une collecte réelle via Firecrawl

### P2 — Industrialisation

**6. Event bus + queue durable (pgmq)**
- Créer table `event_outbox` avec triggers sur tables critiques
- Implémenter des consumers Edge Function pour traiter les événements
- Remplacer le batch polling par du event-driven

**7. Dashboard P&L unifié**
- Ajouter bloc profitabilité au Automation Control Center (marge nette par produit, fees, ads)
- Bloc "confiance data" (fraîcheur des syncs, fiabilité fournisseurs)

**8. Veille concurrents réelle + auto-apply**
- Collecte prix concurrents via Firecrawl (remplacer le fallback hash)
- Règles auto-apply avec confidence threshold

## Estimation d'effort (du rapport)

| Lot | Effort |
|-----|--------|
| P0 Sécurisation + alignement | 18-27 JH |
| P1 Auto-reorder + pricing + 1-2 APIs | 28-44 JH |
| P2 Event bus + P&L + veille | 50-85 JH |

## Approche recommandée

Commencer par **P0** (sécurisation des Edge Functions + alignement schéma) car c'est **bloquant pour la production**. Ensuite P1 pour le MVP opérationnel. P2 pour la différenciation.

## Section technique

Les modifications toucheront principalement :
- **Edge Functions** : supplier-sync-cron, auto-reorder-engine, smart-inventory-engine, pricing-rules-engine, workflow-executor, automation-orchestrator
- **Migrations SQL** : unification tables pricing, event_outbox, audit_logs
- **Hooks React** : useAutomationPolling, usePricingIntelligence, useSupplierSync (adapter aux nouveaux endpoints sécurisés)
- **Config Supabase** : verify_jwt alignement, pg_cron scheduling

**Voulez-vous que je commence par P0 (sécurisation des Edge Functions) ?**

