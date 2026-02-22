
# Drop Craft AI — Plan de Consolidation P0/P1

## Vision
Transformer Drop Craft AI en plateforme SaaS production-ready avec architecture unifiée,
sécurité multi-tenant, et parité concurrentielle (AutoDS/DSers/Channable).

---

## Phase 1 — Fondations P0 (Semaines 1-4)

### 1.1 Unification du Pipeline d'Import
**Problème**: 12+ Edge Functions d'import avec contrats, tables cibles et patterns d'auth différents.
**Solution**: `robust-import-pipeline` devient le SEUL backend d'import.

| Fonction actuelle | Action | Statut |
|---|---|---|
| `robust-import-pipeline` | **GARDER** — Standard | ✅ En place |
| `url-import` | **SÉCURISÉ** → JWT + products canon | ✅ Done |
| `import-products` | **SÉCURISÉ** → JWT + products canon | ✅ Done |
| `quick-import-url` | **SÉCURISÉ** → JWT obligatoire, écrit dans products | ✅ Done |
| `bulk-import-products` | **DÉLÉGUER** → robust-import | 🔲 À faire |
| `bulk-import-multi` | **DÉLÉGUER** → robust-import | 🔲 À faire |
| `csv-import` | **DÉLÉGUER** → robust-import | 🔲 À faire |
| `unified-import` | **DÉPRÉCIER** | 🔲 À faire |
| `xml-json-import` | **DÉLÉGUER** → robust-import | 🔲 À faire |
| `import-cron` | **DOCUMENTÉ** — Exception service_role (cron) | ✅ Done |

### 1.2 Sécurisation des Edge Functions
**Problème**: 247 fichiers utilisent SERVICE_ROLE_KEY, souvent sans auth JWT.
**Solution**: Pattern standard — JWT + ANON_KEY par défaut, service role = exception documentée.

### 1.3 Cohérence API / Schéma
**Table canon**: `products` (source of truth)
**Tables staging**: `imported_products` (drafts), `supplier_products` (feeds fournisseur)

---

## Phase 2 — Automatisation P1 (Semaines 5-8)

### 2.1 Monitoring Prix & Stock unifié
### 2.2 Moteur de Règles industrialisé (Channable-like)
### 2.3 Supplier Fallback automatique

---

## Phase 3 — Production Ready (Semaines 9-12)

### 3.1 Observabilité & Tests E2E
### 3.2 Monétisation Stripe
### 3.3 Scalabilité

---

## Règles d'Architecture

1. **Auth**: JWT + RLS par défaut. Service role = exception documentée.
2. **Import**: Tout passe par `robust-import-pipeline` → `jobs` + `job_items` → `products`.
3. **Source of truth**: `products` table uniquement pour le catalogue.
4. **Champs**: `title` (pas `name`), statuts enum strict, `user_id` non-nullable + RLS.
5. **Rate limiting**: Systématique sur tous les endpoints utilisateur.
6. **Idempotency**: Via `idempotency_key` sur les jobs.
