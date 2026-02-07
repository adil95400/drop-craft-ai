

## Standardiser sur ChannablePageWrapper et supprimer PageLayout

### Contexte
- **84 pages** utilisent deja `ChannablePageWrapper` -- c'est le standard de facto
- **13 pages** utilisent `PageLayout` (migrées recemment par erreur)
- `PageBanner` sera aussi supprime car `ChannablePageWrapper` integre deja son propre hero avec image, badge, description et actions

### Pages a migrer (13 fichiers)

| Page | heroImage suggere |
|------|-------------------|
| `ChannableProductsPage.tsx` | `products` |
| `ProductCockpitPage.tsx` | `analytics` |
| `ProductScoringPage.tsx` | `products` |
| `PriceRulesPage.tsx` | `products` |
| `ImportHub.tsx` | `import` |
| `CatalogHealthPage.tsx` | `products` |
| `StoresPage.tsx` | `integrations` |
| `SEOManagerPage.tsx` | `marketing` |
| `CompetitorAnalysisPage.tsx` | `research` |
| `ResearchHub.tsx` | `research` |
| `AdvancedAnalyticsPage.tsx` | `analytics` |
| `AcademyPage.tsx` | `support` |
| `CustomerManagementPage.tsx` | `orders` |

### Fichiers a supprimer
- `src/components/shared/PageLayout.tsx`
- `src/components/shared/PageBanner.tsx`
- Mise a jour de `src/components/shared/index.ts` pour retirer les exports

### Regles de conversion

Pour chaque page, le mapping est direct :

```text
PageLayout                    -->  ChannablePageWrapper
  title="..."                 -->    title="..."
  subtitle="..."              -->    subtitle="..."  (ou description="...")
  actions={...}               -->    actions={...}

PageBanner                    -->  (supprime, info integree dans le hero)
  icon={X}                    -->    badge={{ label: "...", icon: X }}
  title="..."                 -->    (fusionne dans description)
  description="..."           -->    description="..."
  theme="purple"              -->    heroImage="..." (image thematique)
```

### Composants partages conserves
`StatCard`, `DataTable`, `BaseModal`, `ActionBar` restent dans `src/components/shared/` -- seuls `PageLayout` et `PageBanner` sont supprimes.

### Ordre d'execution
1. Migrer les 13 pages vers `ChannablePageWrapper`
2. Retirer `PageLayout` et `PageBanner` des exports (`shared/index.ts`)
3. Supprimer `PageLayout.tsx` et `PageBanner.tsx`
4. Mettre a jour les memories du design system

