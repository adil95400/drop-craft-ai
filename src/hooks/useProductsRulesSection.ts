/**
 * Hook pour la gestion des règles produits
 * Extrait de ChannableProductsPage pour modularité
 */

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProductRules } from '@/hooks/useProductRules'
import { ProductRule } from '@/lib/rules/ruleTypes'
import { useToast } from '@/hooks/use-toast'

type MainView = 'products' | 'rules'
type RuleSubTab = 'catalog' | 'pricing' | 'feeds' | 'executions'

export function useProductsRulesSection() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  
  // Hook pour les règles
  const { 
    rules, 
    stats: rulesStats, 
    templates,
    isLoading: rulesLoading, 
    toggleRule, 
    deleteRule,
    createRule,
    createFromTemplate,
    isDeleting 
  } = useProductRules()

  // === RULES STATE ===
  const initialMainView = searchParams.get('tab') === 'rules' ? 'rules' : 'products'
  const [mainView, setMainView] = useState<MainView>(initialMainView)
  const [ruleSubTab, setRuleSubTab] = useState<RuleSubTab>('catalog')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [testerOpen, setTesterOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ProductRule | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null)

  // === URL SYNC ===
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl === 'rules') {
      setMainView('rules')
      const subTab = searchParams.get('subTab')
      if (subTab && ['catalog', 'pricing', 'feeds', 'executions'].includes(subTab)) {
        setRuleSubTab(subTab as RuleSubTab)
      }
    } else {
      setMainView('products')
    }
  }, [searchParams])

  // === HANDLERS ===
  const handleMainViewChange = useCallback((view: MainView) => {
    setMainView(view)
    if (view === 'rules') {
      setSearchParams({ tab: 'rules', subTab: ruleSubTab })
    } else {
      setSearchParams({})
    }
  }, [setSearchParams, ruleSubTab])

  const handleRuleSubTabChange = useCallback((subTab: RuleSubTab) => {
    setRuleSubTab(subTab)
    setSearchParams({ tab: 'rules', subTab })
  }, [setSearchParams])

  const handleEditRule = useCallback((rule: ProductRule) => {
    setSelectedRule(rule)
    setBuilderOpen(true)
  }, [])

  const handleNewRule = useCallback(() => {
    setSelectedRule(undefined)
    setBuilderOpen(true)
  }, [])

  const handleDeleteRule = useCallback((ruleId: string) => {
    setRuleToDelete(ruleId)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDeleteRule = useCallback(() => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete)
      setDeleteDialogOpen(false)
      setRuleToDelete(null)
    }
  }, [ruleToDelete, deleteRule])

  const handleSelectTemplate = useCallback(async (templateId: string) => {
    await createFromTemplate(templateId)
    setTemplatesOpen(false)
  }, [createFromTemplate])

  const handleTestRule = useCallback((rule: ProductRule) => {
    setSelectedRule(rule)
    setTesterOpen(true)
  }, [])

  const handleDuplicateRule = useCallback((rule: ProductRule) => {
    createRule({
      ...rule,
      id: undefined,
      name: `${rule.name} (copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successCount: 0,
      errorCount: 0,
    } as any)
    toast({ title: 'Règle dupliquée', description: 'La copie a été créée avec succès' })
  }, [createRule, toast])

  return {
    // Data
    rules,
    rulesStats,
    templates,
    rulesLoading,
    isDeleting,
    
    // View state
    mainView,
    ruleSubTab,
    builderOpen,
    templatesOpen,
    testerOpen,
    selectedRule,
    deleteDialogOpen,
    
    // Setters
    setBuilderOpen,
    setTemplatesOpen,
    setTesterOpen,
    setDeleteDialogOpen,
    
    // Handlers
    handleMainViewChange,
    handleRuleSubTabChange,
    handleEditRule,
    handleNewRule,
    handleDeleteRule,
    confirmDeleteRule,
    handleSelectTemplate,
    handleTestRule,
    handleDuplicateRule,
    toggleRule,
  }
}
