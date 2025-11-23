# 🎯 ROADMAP DE FINALISATION - Drop Craft AI

## 📊 État Actuel (Audit Détaillé)

### ✅ **Points Forts**
- **Architecture**: Système unifié en place (`UnifiedAuthContext`, `unified-plan-system`)
- **Edge Functions**: 218 fonctions déployées et structurées
- **Base de données**: RLS policies complètes, 60+ fonctions SQL sécurisées
- **Admin**: Système complet (94/100) avec audit trail
- **Design System**: Tokens sémantiques HSL, tailwind.config.ts structuré
- **Intégrations**: Canva, OpenAI, Microsoft partiellement intégrées

### ⚠️ **Points à Finaliser**

#### 1. **Routes & Pages Manquantes** (PRIORITÉ HAUTE)
D'après BUTTONS_AUDIT.md:
- [ ] `/import/advanced` - Page d'import avancé
- [ ] `/sync-manager` - Gestionnaire de synchronisation
- [ ] `/orders-center` - Centre de commandes unifié (différent de `/orders`)
- [ ] Pages Ultra Pro manquantes

**Actions**:
1. Créer `src/pages/import/AdvancedImportPage.tsx`
2. Créer `src/pages/sync/SyncManagerPage.tsx`
3. Créer `src/pages/orders/OrdersCenterPage.tsx`
4. Ajouter les routes dans `src/routes/index.tsx`

---

#### 2. **Boutons & Actions Réels** (PRIORITÉ HAUTE)

##### 2.1 Import/Export (Priorité Moyenne)
Fichiers concernés:
- `src/components/products/ProductActionsBar.tsx`
- `src/components/products/ProductBulkOperations.tsx`

**À implémenter**:
```typescript
// Import CSV
const handleImport = async (file: File) => {
  const { data, error } = await supabase.functions.invoke('csv-import', {
    body: { file, mapping: columnMapping }
  })
}

// Export CSV
const handleExport = async (products: Product[]) => {
  const { data, error } = await supabase.functions.invoke('export-data', {
    body: { products, format: 'csv' }
  })
}
```

##### 2.2 Actions Groupées Produits (Priorité Basse)
- [ ] Modification en masse (prix, stock, catégorie)
- [ ] Suppression groupée
- [ ] Export sélection
- [ ] Publication/dépublication groupée

**Edge Function à finaliser**: `bulk-operations`

##### 2.3 Actions Commandes (Priorité Moyenne)
Fichier: `src/pages/orders/OrdersPage.tsx`
- [ ] Voir détails commande (modal)
- [ ] Changer statut (processing → shipped → delivered)
- [ ] Ajouter numéro de suivi
- [ ] Imprimer bon de livraison
- [ ] Export CSV commandes

**Edge Functions**:
- `order-automation` (existe, à vérifier)
- `order-tracking` (existe, à finaliser)

---

#### 3. **Migration Système Unifié** (PRIORITÉ CRITIQUE)

##### 3.1 Hooks à Migrer
Fichiers trouvés utilisant l'ancien système:
- `src/components/app-flow/AppFlowManager.tsx`
- `src/components/onboarding/OnboardingChecklist.tsx`
- `src/components/pricing/PricingCard.tsx`
- `src/domains/extensions/components/ExtensionMarketplace.tsx`
- `src/hooks/useStripeIntegration.ts`

**Migration à faire**:
```typescript
// ❌ ANCIEN
import { usePlan } from '@/contexts/PlanContext'

// ✅ NOUVEAU
import { useUnifiedPlan } from '@/lib/unified-plan-system'
```

##### 3.2 Supprimer Fichiers Dépréciés
- [ ] Vérifier si `src/contexts/AuthContext.tsx` peut être supprimé
- [ ] Vérifier les anciens hooks dans `src/hooks/` (usePlan, etc.)

---

#### 4. **Edge Functions à Finaliser** (PRIORITÉ HAUTE)

##### 4.1 Functions Mock à Compléter

**Analyse nécessaire**:
Je dois parcourir les 218 fonctions pour identifier:
1. Celles qui retournent des données mock
2. Celles sans gestion d'erreur complète
3. Celles sans authentification/RLS

**Structure standard attendue**:
```typescript
// ✅ Structure complète
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Vérifier auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Logique métier...

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

##### 4.2 Fonctions Prioritaires à Vérifier
1. **Import/Export**:
   - `csv-import`, `export-data`, `xml-json-import`
2. **Orders**:
   - `order-automation`, `order-tracking`, `order-fulfillment-auto`
3. **Products**:
   - `bulk-operations`, `publish-products`, `product-research-scanner`
4. **Sync**:
   - `marketplace-sync`, `supplier-sync`, `auto-sync-scheduler`
5. **AI**:
   - `ai-automation-engine`, `ai-insights`, `ai-marketing-content`

---

#### 5. **Modals & Formulaires** (PRIORITÉ MOYENNE)

##### 5.1 Modals à Finaliser
- [ ] `CreateProductDialog` - Vérifier soumission complète
- [ ] `EditOrderModal` - Implémenter
- [ ] `BulkEditModal` - Implémenter
- [ ] `ImportMappingModal` - Finaliser
- [ ] `ExportConfigModal` - Implémenter

##### 5.2 Formulaires à Vérifier
- [ ] Formulaire création produit → Edge function `import-products`
- [ ] Formulaire création commande → Edge function `order-automation`
- [ ] Formulaire intégration marketplace → Edge function `marketplace-connect`
- [ ] Formulaire CRM → Edge function `crm-automation`

---

#### 6. **QA par Domaine** (PRIORITÉ FINALE)

##### 6.1 Produits (`/products/*`)
- [ ] Liste produits → API + Pagination
- [ ] Création produit → Modal + Edge function
- [ ] Modification → Modal + Edge function
- [ ] Import CSV → Upload + Mapping + Edge function
- [ ] Export CSV → Edge function
- [ ] Bulk actions → Edge function
- [ ] Catalogue → RLS policies + Masquage données sensibles

##### 6.2 Commandes (`/orders/*`, `/orders-center`)
- [ ] Liste commandes → API + Filtres
- [ ] Détails commande → Modal + Données complètes
- [ ] Changer statut → Edge function
- [ ] Tracking → Edge function
- [ ] Export → Edge function
- [ ] Automation → Edge function configuré

##### 6.3 CRM (`/crm/*`)
- [ ] Liste clients → API
- [ ] Fiche client → Données masquées (RLS)
- [ ] Segmentation → Edge function
- [ ] Campagnes → Edge function `crm-automation`
- [ ] Analytics → Edge function `customer-intelligence`

##### 6.4 Workflows (`/automation/*`)
- [ ] Liste workflows → API
- [ ] Création workflow → Modal + Edge function
- [ ] Exécution → Edge function `workflow-executor`
- [ ] Logs → Affichage

##### 6.5 Analytics (`/analytics/*`)
- [ ] Dashboard → Edge function `advanced-analytics`
- [ ] Rapports custom → Edge function
- [ ] Export → Edge function
- [ ] Prédictions → Edge function `ai-predictive-ml`

##### 6.6 Intégrations (`/integrations/*`)
- [ ] Liste intégrations → API
- [ ] OAuth → Edge functions (Canva, Shopify, etc.)
- [ ] Webhooks → Edge functions handlers
- [ ] Sync → Edge functions schedulers

##### 6.7 Billing (`/pricing`, `/billing`)
- [ ] Plans → Affichage + Stripe
- [ ] Checkout → Edge function `stripe-checkout`
- [ ] Portal → Edge function `stripe-portal`
- [ ] Webhooks → Edge function `stripe-webhook`

---

## 🎯 PLAN D'EXÉCUTION RECOMMANDÉ

### Phase 1: Fondations (2-3h)
1. ✅ Migrer tous les hooks vers système unifié
2. ✅ Créer les pages manquantes de base
3. ✅ Nettoyer fichiers dépréciés

### Phase 2: Actions Critiques (3-4h)
4. ✅ Finaliser Import/Export produits
5. ✅ Finaliser actions commandes
6. ✅ Implémenter modals principaux

### Phase 3: Edge Functions (4-6h)
7. ✅ Auditer et corriger les 20 fonctions prioritaires
8. ✅ Ajouter auth/RLS partout
9. ✅ Uniformiser structure réponses

### Phase 4: QA Domaine par Domaine (6-8h)
10. ✅ Produits
11. ✅ Commandes
12. ✅ CRM
13. ✅ Analytics
14. ✅ Workflows
15. ✅ Intégrations
16. ✅ Billing

### Phase 5: Polish Final (2h)
17. ✅ Corrections bugs mineurs
18. ✅ Messages d'erreur UX
19. ✅ Logs et monitoring
20. ✅ Documentation API

---

## 📋 CHECKLIST FINALE

### Avant de passer à la production:
- [ ] Aucun `TODO`, `FIXME`, `PLACEHOLDER` dans le code
- [ ] Tous les boutons ont des actions réelles
- [ ] Toutes les routes existent et sont protégées
- [ ] Tous les formulaires soumettent à une edge function
- [ ] Tous les modals ont validation + erreurs + succès
- [ ] RLS policies actives sur toutes les tables sensibles
- [ ] Auth vérifiée dans toutes les edge functions
- [ ] Logs structurés dans toutes les fonctions critiques
- [ ] Tests manuels sur chaque domaine
- [ ] Documentation API à jour

---

## 🚀 COMMENT DÉMARRER

**Choix A**: Exécution complète automatique
→ Je crée tous les fichiers/corrections en masse (⚠️ très long)

**Choix B**: Exécution par phase
→ Je commence par Phase 1, puis Phase 2, etc.

**Choix C**: Exécution par domaine
→ Je finis complètement Produits, puis Commandes, etc.

**Quelle approche préfères-tu ?**
