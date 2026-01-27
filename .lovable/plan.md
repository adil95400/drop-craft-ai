
# 🎯 Plan d'Exécution : /products V2 — Command Center Business

## Vision Stratégique

Transformer `/products` d'un "dashboard passif" en un **Command Center orienté action** qui répond en 5 secondes à : "Quoi faire maintenant pour maximiser mon business ?"

---

## 📊 Analyse de l'Existant

### Composants Réutilisables (✅ Conserver)
| Composant | Localisation | Rôle |
|-----------|-------------|------|
| `ChannablePageWrapper` | `/components/channable/` | Layout page + hero |
| `ChannableStatsGrid` | `/components/channable/` | Grille KPI animée |
| `ProductsQuickActionsBar` | `/catalog/` | Barre d'actions rapides |
| `EnhancedProductCard` | `/products/` | Carte produit avec score IA |
| `PriorityManager` | `/products/` | Logique priorisation IA |
| `BulkAIActions` | `/products/` | Actions IA en masse |
| `useUnifiedProducts` | `/hooks/` | Source données unifiée |
| `useProductsAudit` | `/hooks/` | Calcul scores qualité |
| `usePriceRules` | `/hooks/` | Règles de prix |

### Données Disponibles (✅ Déjà en Base)
- **products** + **imported_products** : Catalogue complet
- **price_rules** : Règles de prix actives
- **product_channel_mappings** : Synchronisation boutiques
- **ai_optimization_jobs** : Historique optimisations IA
- **stock_predictions** : Prédictions stock (Intelligence IA)

---

## 🏗️ Architecture Cible

```text
┌────────────────────────────────────────────────────────────────────┐
│                    ChannablePageWrapper                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              🆕 COMMAND CENTER                                │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │
│  │  │Stock    │ │Qualité  │ │Sans     │ │Reco IA  │            │  │
│  │  │Critique │ │Faible   │ │Règle    │ │En       │            │  │
│  │  │🔴 1786  │ │🟠 342   │ │🔵 89    │ │🧠 Attente│            │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              📈 KPI BUSINESS (Restructurés)                   │  │
│  │  Stock Faible │ Actifs │ Valeur │ Score │ À Optimiser        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              🎛️ FILTRES INTELLIGENTS                         │  │
│  │  [À Risque] [Rentables] [Sans Règle] [Non Sync] [Reco IA]   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              📋 CATALOGUE PRODUITS                            │  │
│  │  (EnhancedProductCard avec badges + micro-infos)             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Livrables Détaillés

### 1️⃣ Mapping UI → Composants

#### Nouveaux Composants à Créer

| Composant | Fichier | Description |
|-----------|---------|-------------|
| `CommandCenterSection` | `src/components/products/command-center/CommandCenterSection.tsx` | Container principal du Command Center |
| `ActionCard` | `src/components/products/command-center/ActionCard.tsx` | Carte action (stock critique, qualité, etc.) |
| `SmartFiltersBar` | `src/components/products/command-center/SmartFiltersBar.tsx` | Filtres métier intelligents |
| `BusinessKPIGrid` | `src/components/products/command-center/BusinessKPIGrid.tsx` | KPI réorganisés (simplifié) |
| `ProductCardEnhanced` | Modifier `EnhancedProductCard.tsx` | Ajouter badges + micro-infos |

#### Composants Existants à Modifier

| Composant | Modification |
|-----------|-------------|
| `ChannableProductsPage.tsx` | Intégrer Command Center en haut, restructurer layout |
| `ProductsQuickActionsBar.tsx` | Ajouter mode de lecture (Standard/Audit/Business) |
| `ProductsStatsSection.tsx` | Simplifier en 2 lignes de KPI |
| `EnhancedProductCard.tsx` | Ajouter badges visuels + micro-infos |

#### Structure des Fichiers

```text
src/components/products/command-center/
├── index.ts                    # Exports
├── CommandCenterSection.tsx    # Container principal
├── ActionCard.tsx              # Carte action individuelle
├── SmartFiltersBar.tsx         # Filtres intelligents
├── BusinessKPIGrid.tsx         # KPI business simplifié
├── useCommandCenterData.ts     # Hook données Command Center
└── types.ts                    # Types TypeScript
```

---

### 2️⃣ Labels UX + Micro-copy

#### Command Center - Titres Orientés Action

| Carte | Titre | Sous-titre | Tooltip |
|-------|-------|-----------|---------|
| Stock Critique | "🔴 Stock critique" | "{count} produits" | "Ces produits risquent la rupture dans les 7 prochains jours" |
| Qualité Faible | "🟠 Qualité à améliorer" | "{count} produits" | "Score qualité < 40/100 - Impact sur les ventes et le SEO" |
| Sans Règle Prix | "🔵 Sans règle de prix" | "{count} produits" | "Ces produits n'ont aucune règle de tarification active" |
| Recommandations IA | "🧠 Recommandations IA" | "{count} en attente" | "L'IA a identifié des opportunités d'optimisation" |
| Non Synchronisés | "🔄 Non synchronisés" | "{count} produits" | "Ces produits n'ont pas été mis à jour sur vos boutiques" |

#### Filtres Intelligents - Labels

| Filtre | Label FR | Description Tooltip |
|--------|----------|-------------------|
| at_risk | "À risque" | "Produits avec stock faible OU qualité < 40" |
| profitable | "Rentables" | "Marge > 30% et stock disponible" |
| no_price_rule | "Sans règle prix" | "Aucune règle de tarification appliquée" |
| not_synced | "Non synchronisés" | "Dernière sync > 24h ou jamais synchronisé" |
| ai_recommended | "Recommandés IA" | "L'IA suggère une action d'optimisation" |
| losing_margin | "Perte de marge" | "Marge en baisse vs moyenne historique" |

#### CTA Produits

| Action | Label | Icône |
|--------|-------|-------|
| edit | "Modifier" | Edit |
| optimize_ai | "Optimiser IA" | Sparkles |
| apply_price_rule | "Appliquer règle" | DollarSign |
| sync | "Synchroniser" | RefreshCw |
| view | "Voir détails" | Eye |

---

### 3️⃣ Logique IA pour Command Center

#### Règles de Détection "Produit à Risque"

```typescript
interface RiskScore {
  score: number;       // 0-100 (100 = très risqué)
  factors: RiskFactor[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface RiskFactor {
  type: 'stock' | 'quality' | 'margin' | 'sync' | 'price_rule';
  weight: number;
  value: number;
  threshold: number;
}
```

#### Pondération des Facteurs

| Facteur | Poids | Seuil Critique | Calcul |
|---------|-------|----------------|--------|
| Stock | 35% | < 10 unités | `(threshold - stock) / threshold * 35` |
| Qualité | 25% | Score < 40 | `(threshold - score) / threshold * 25` |
| Marge | 20% | < 15% | `(threshold - margin) / threshold * 20` |
| Sync | 10% | > 24h | `hours_since_sync > 24 ? 10 : 0` |
| Règle Prix | 10% | Aucune | `has_price_rule ? 0 : 10` |

#### Priorisation des Recommandations

```typescript
const calculatePriority = (product: UnifiedProduct): Priority => {
  const riskScore = calculateRiskScore(product);
  const businessImpact = product.price * (product.stock_quantity || 0);
  
  // Score final = RiskScore × BusinessImpact
  const priorityScore = riskScore.score * Math.log10(businessImpact + 1);
  
  if (priorityScore > 80) return 'critical';
  if (priorityScore > 50) return 'high';
  if (priorityScore > 25) return 'medium';
  return 'low';
};
```

#### Types de Recommandations IA

| Type | Condition | Action Suggérée |
|------|-----------|-----------------|
| `restock` | stock < 10 | "Réapprovisionner" |
| `optimize_content` | quality < 40 | "Améliorer le contenu" |
| `apply_pricing` | no_price_rule | "Appliquer une règle de prix" |
| `sync_stores` | last_sync > 24h | "Synchroniser les boutiques" |
| `review_margin` | margin < 15% | "Revoir la tarification" |

---

### 4️⃣ Roadmap Produit 90 Jours

#### Phase 1 — Quick Wins (Semaines 1-2)

| Tâche | Priorité | Effort | Impact |
|-------|----------|--------|--------|
| Créer `CommandCenterSection` avec 4 cartes action | 🔴 Haute | 4h | ⭐⭐⭐ |
| Restructurer KPI en 2 lignes business | 🔴 Haute | 2h | ⭐⭐ |
| Ajouter `SmartFiltersBar` avec 6 filtres | 🔴 Haute | 3h | ⭐⭐⭐ |
| Créer hook `useCommandCenterData` | 🔴 Haute | 2h | ⭐⭐ |
| Intégrer dans `ChannableProductsPage` | 🟠 Moyenne | 2h | ⭐⭐ |

**Livrables Phase 1:**
- Command Center fonctionnel avec 4 cartes
- Filtres intelligents opérationnels
- KPI réorganisés et cliquables

#### Phase 2 — Premium (Semaines 3-4)

| Tâche | Priorité | Effort | Impact |
|-------|----------|--------|--------|
| Enrichir `EnhancedProductCard` avec badges | 🟠 Moyenne | 3h | ⭐⭐ |
| Ajouter micro-infos (marge, sync, règle) | 🟠 Moyenne | 2h | ⭐⭐ |
| Créer mode de lecture "Business" | 🟠 Moyenne | 4h | ⭐⭐⭐ |
| Animations Framer Motion sur cartes action | 🟢 Basse | 2h | ⭐ |
| Intégrer données `product_channel_mappings` | 🟠 Moyenne | 2h | ⭐⭐ |

**Livrables Phase 2:**
- Badges visuels sur chaque produit
- 3 modes de lecture (Standard/Audit/Business)
- Animations premium

#### Phase 3 — Avancé (Semaines 5-8)

| Tâche | Priorité | Effort | Impact |
|-------|----------|--------|--------|
| IA prédictive (stock_predictions) | 🟠 Moyenne | 6h | ⭐⭐⭐ |
| Recommandations contextualisées | 🟠 Moyenne | 4h | ⭐⭐ |
| Pilotage marge/ROI temps réel | 🟢 Basse | 4h | ⭐⭐ |
| Alertes push (price-stock-monitor) | 🟢 Basse | 3h | ⭐ |
| Dashboard ROI par produit | 🟢 Basse | 4h | ⭐⭐ |

**Livrables Phase 3:**
- Prédictions stock intégrées
- Alertes proactives
- Vue ROI complète

---

## 🎨 Spécifications Visuelles

### Command Center Cards

```typescript
interface ActionCardProps {
  type: 'stock' | 'quality' | 'price_rule' | 'ai' | 'sync';
  count: number;
  label: string;
  sublabel: string;
  color: 'destructive' | 'warning' | 'info' | 'primary' | 'muted';
  icon: LucideIcon;
  onClick: () => void;
  trend?: { value: number; direction: 'up' | 'down' };
}
```

### Couleurs par Gravité

| Gravité | Background | Border | Text |
|---------|------------|--------|------|
| Critique | `bg-red-500/10` | `border-red-500/30` | `text-red-600` |
| Haute | `bg-orange-500/10` | `border-orange-500/30` | `text-orange-600` |
| Moyenne | `bg-blue-500/10` | `border-blue-500/30` | `text-blue-600` |
| Info | `bg-purple-500/10` | `border-purple-500/30` | `text-purple-600` |

### Badges Produit

| Badge | Condition | Couleur |
|-------|-----------|---------|
| 🔴 Stock critique | stock < 5 | `bg-red-500` |
| 🟡 Qualité moyenne | 40 ≤ score < 70 | `bg-amber-500` |
| 🟢 Optimisé IA | has_ai_optimization | `bg-emerald-500` |
| 🔵 Règle active | has_price_rule | `bg-blue-500` |
| ⚪ Non sync | last_sync > 24h | `bg-gray-400` |

---

## 🔧 Détails Techniques

### Hook `useCommandCenterData`

```typescript
export function useCommandCenterData(products: UnifiedProduct[]) {
  const { data: priceRules } = usePriceRules();
  const { auditResults, stats: auditStats } = useProductsAudit(products);
  
  return useMemo(() => {
    const stockCritical = products.filter(p => (p.stock_quantity || 0) < 10);
    const lowQuality = auditResults.filter(r => r.score.global < 40);
    const noPriceRule = products.filter(p => !hasPriceRule(p.id, priceRules));
    const notSynced = products.filter(p => !isRecentlySynced(p));
    const aiRecommended = products.filter(p => hasAIRecommendation(p));
    
    return {
      cards: [
        { type: 'stock', count: stockCritical.length, products: stockCritical },
        { type: 'quality', count: lowQuality.length, products: lowQuality },
        { type: 'price_rule', count: noPriceRule.length, products: noPriceRule },
        { type: 'ai', count: aiRecommended.length, products: aiRecommended },
      ],
      smartFilters: {
        atRisk: [...stockCritical, ...lowQuality.map(r => r.productId)],
        profitable: getProfitableProducts(products),
        noPriceRule: noPriceRule.map(p => p.id),
        notSynced: notSynced.map(p => p.id),
        aiRecommended: aiRecommended.map(p => p.id),
      }
    };
  }, [products, priceRules, auditResults]);
}
```

### Intégration dans ChannableProductsPage

L'intégration sera minimale et non-destructive :

```typescript
// Dans ChannableProductsPage.tsx - Ajout après le wrapper hero
<ChannablePageWrapper {...heroProps}>
  {/* 🆕 Command Center - Nouveau bloc */}
  {mainView === 'products' && (
    <CommandCenterSection
      products={products}
      onFilterChange={handleSmartFilter}
      onActionClick={handleCommandAction}
    />
  )}
  
  {/* Existing: Main View Tabs */}
  <div className="flex items-center gap-2 border-b">
    {/* ... tabs existants ... */}
  </div>
  
  {/* Existing: Content */}
  {mainView === 'products' && (
    <>
      <BusinessKPIGrid stats={stats} auditStats={auditStats} />
      <SmartFiltersBar 
        activeFilter={activeSmartFilter}
        onFilterChange={setActiveSmartFilter}
        counts={commandCenterData.smartFilters}
      />
      <ProductsQuickActionsBar {...existingProps} />
      {/* ... reste du contenu existant ... */}
    </>
  )}
</ChannablePageWrapper>
```

---

## ✅ Contraintes Respectées

| Contrainte | Comment Respectée |
|------------|------------------|
| Ne pas casser l'existant | Ajout de composants, pas de suppression |
| Réutiliser les composants | 9 composants existants conservés |
| Refactor UX, pas refonte lourde | Restructuration du layout uniquement |
| Implémentation incrémentale | 3 phases distinctes sur 8 semaines |
| Impact business réel | Chaque feature liée à une action mesurable |

---

## 📋 Prochaines Étapes

1. **Validation** de ce plan
2. **Phase 1 - Semaine 1** : Création Command Center + hook données
3. **Phase 1 - Semaine 2** : Filtres intelligents + KPI réorganisés
4. **Test & Itération** avant Phase 2

---

**Prêt à démarrer l'implémentation Phase 1 sur validation.**
