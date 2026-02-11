

# Migration DB "Produit Final" -- Schema AutoDS/Channable

## Situation actuelle

**Tables existantes deja alignees :**
| Table | Colonnes | RLS | Donnees |
|-------|----------|-----|---------|
| `products` | 33 colonnes (id, user_id, title, sku, barcode, price, cost_price, status, images jsonb, variants jsonb, tags, seo_title, seo_description, brand, product_type, vendor, weight...) | Oui | 0 lignes |
| `product_variants` | 21 colonnes (id, product_id, user_id, sku, price, cost_price, stock_quantity, option1-3 name/value, image_url, status) | Oui | 0 lignes |
| `product_images` | 12 colonnes (id, product_id, variant_id, url, alt_text, position, is_primary, width, height, file_size, user_id) | Oui | 0 lignes |
| `product_store_links` | 12 colonnes (id, product_id, store_id, external_product_id, sync_status, published, last_sync_at) | Oui | 0 lignes |
| `product_sources` | 11 colonnes (id, user_id, product_id, source_platform, external_product_id, source_url, source_data jsonb) | Oui | 0 lignes |
| `stores` | 9 colonnes (id, user_id, platform, name, domain, status, metadata) | Oui | 0 lignes |
| `pricing_rules` | 17 colonnes existantes | Oui | - |
| `product_pricing_state` | 11 colonnes existantes | - | - |
| `imported_products` | 41 colonnes | - | **25 lignes** |

**Tables a CREER (aucune n'existe) :**
1. `product_tags` -- Tags normalises
2. `product_tag_links` -- Lien produit-tags
3. `product_collections` -- Categories/collections canoniques
4. `product_collection_links` -- Lien produit-collections
5. `product_costs` -- Cout fournisseur par variante
6. `pricing_rulesets` -- Regles pricing par boutique
7. `product_prices` -- Prix canonique et par boutique
8. `inventory_locations` -- Emplacements (entrepots, fournisseurs, boutiques)
9. `inventory_levels` -- Stock par variante par location
10. `product_seo` -- SEO applique canonique ou par boutique/langue
11. `product_seo_versions` -- Historique SEO (audit trail)
12. `ai_generations` -- Generations IA generiques (overlay)
13. `store_variants` -- Mapping variant canonique vers variant boutique
14. `product_events` -- Audit log produit

**Tables existantes a ENRICHIR (ALTER) :**
- `products` : ajouter `default_language`, `description_html`, `primary_image_url` (3 colonnes)
- `product_variants` : ajouter `barcode`, `weight_unit`, `is_active` (3 colonnes)
- `stores` : ajouter `access_token_encrypted` (1 colonne, pour completude)

---

## Plan d'execution

### Phase 1 -- ALTER tables existantes (3 colonnes sur `products`, 3 sur `product_variants`)

Ajouter les colonnes manquantes du schema cible aux tables existantes, sans casser le code actuel.

### Phase 2 -- CREATE 14 nouvelles tables + index + RLS

Chaque table sera creee avec :
- Cle primaire UUID `gen_random_uuid()`
- `user_id UUID NOT NULL` pour le RLS (remplace `tenant_id` du schema car user_id = tenant dans ShopOpti)
- Index sur les colonnes de recherche
- Contraintes UNIQUE la ou necessaire
- RLS activee + policies SELECT/INSERT/UPDATE/DELETE

Ordre de creation (respect des FK) :
1. `product_tags` (standalone)
2. `product_tag_links` (FK products, product_tags)
3. `product_collections` (self-referencing parent_id)
4. `product_collection_links` (FK products, product_collections)
5. `product_costs` (FK product_variants)
6. `pricing_rulesets` (FK stores nullable)
7. `product_prices` (FK product_variants, stores, pricing_rulesets)
8. `inventory_locations` (FK stores nullable)
9. `inventory_levels` (FK product_variants, inventory_locations)
10. `product_seo` (FK products, stores)
11. `product_seo_versions` (FK products, stores)
12. `ai_generations` (standalone, generic target)
13. `store_variants` (FK stores, product_variants)
14. `product_events` (FK products nullable, product_variants nullable)

### Phase 3 -- Migrer les 25 produits importes

Script SQL de migration pour copier les 25 lignes de `imported_products` vers `products` + creer les variantes dans `product_variants` + lier les sources dans `product_sources`.

### Phase 4 -- Mettre a jour les types TypeScript

Fichiers a modifier :
- `src/domains/commerce/types.ts` -- aligner sur le nouveau schema
- `src/types/catalog.ts` -- aligner CatalogProduct
- `src/services/ProductsUnifiedService.ts` -- aligner UnifiedProduct + mapRecordToUnified
- `src/services/products.service.ts` -- adapter les appels si necessaire

### Phase 5 -- Creer les hooks d'acces

Nouveaux hooks React Query :
- `useProductTags` -- CRUD tags
- `useProductCollections` -- CRUD collections
- `useProductCosts` -- Couts fournisseurs
- `useProductPrices` -- Prix multi-boutiques
- `useInventoryLevels` -- Stock multi-locations
- `useProductSEO` -- SEO + versions
- `useAIGenerations` -- Overlay IA
- `useProductEvents` -- Audit log lecture
- `useStoreVariants` -- Mapping variantes boutiques

---

## Details techniques -- Schema SQL

### Nouvelles tables

```text
product_tags (id, user_id, name UNIQUE per user, created_at)
product_tag_links (product_id, tag_id, PK composite)
product_collections (id, user_id, name, parent_id self-ref, created_at)
product_collection_links (product_id, collection_id, PK composite)
product_costs (id, user_id, variant_id FK, currency, cost_amount, shipping_cost, landed_cost, source enum, updated_at)
pricing_rulesets (id, user_id, store_id FK nullable, name, rules_json, is_default, created_at)
product_prices (id, user_id, variant_id FK, store_id nullable, currency, price_amount, compare_at_amount, pricing_ruleset_id FK nullable, updated_at)
inventory_locations (id, user_id, store_id FK nullable, name, type enum, created_at)
inventory_levels (id, user_id, variant_id FK, location_id FK, qty_available, qty_reserved default 0, updated_at)
product_seo (id, user_id, product_id FK, store_id nullable, language, handle, seo_title, meta_description, canonical_url, updated_at) UNIQUE(product_id, store_id, language)
product_seo_versions (id, user_id, product_id FK, store_id nullable, language, version int, fields_json, source enum, created_at)
ai_generations (id, user_id, target_type enum, target_id, task enum, language, provider, model, prompt_hash, input_json, output_json, cost_usd, tokens_in, tokens_out, created_at)
store_variants (id, user_id, store_id FK, variant_id FK, external_variant_id, external_inventory_item_id, last_synced_at)
product_events (id, user_id, product_id nullable, variant_id nullable, event_type enum, actor_type enum, actor_id, payload jsonb, created_at)
```

### Index cles

- `product_tags`: UNIQUE(user_id, name)
- `product_costs`: (user_id, variant_id)
- `product_prices`: (user_id, variant_id), (store_id, variant_id)
- `inventory_levels`: (user_id, variant_id), (location_id)
- `product_seo`: UNIQUE(product_id, store_id, language)
- `ai_generations`: (user_id, target_type, target_id), (prompt_hash)
- `product_events`: (user_id, product_id), (created_at DESC)

### RLS

Toutes les tables : `auth.uid() = user_id` pour SELECT/UPDATE/DELETE, `auth.uid()` check sur INSERT via WITH CHECK.

---

## Impact sur le code existant

- **Zero breaking change** : les tables existantes (products, product_variants, stores, product_store_links) gardent toutes leurs colonnes ; on ajoute seulement.
- **Les 25 produits importes** seront migres vers `products` pour devenir source de verite.
- **Les services API** (`ProductsUnifiedService`, `ProductsService`) continueront de fonctionner -- les nouveaux hooks seront utilises en complement pour les nouvelles fonctionnalites (tags, collections, pricing multi-store, SEO versionne, audit log).

