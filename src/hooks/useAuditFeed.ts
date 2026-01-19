/**
 * Hook pour l'audit des feeds produits
 * Valide les feeds par marketplace/canal de vente
 */

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { UnifiedProduct, useUnifiedProducts } from './useUnifiedProducts'

export interface FeedChannel {
  id: string
  name: string
  platform: 'google_shopping' | 'facebook_catalog' | 'amazon' | 'criteo' | 'bing' | 'pinterest' | 'tiktok'
  icon: string
  status: 'valid' | 'warning' | 'error' | 'pending'
  productsTotal: number
  productsValid: number
  productsWarning: number
  productsError: number
  lastSync: string | null
  nextSync: string | null
  feedUrl?: string
  validationErrors: FeedValidationError[]
}

export interface FeedValidationError {
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
  affectedProducts: number
  productIds: string[]
  fixSuggestion: string
}

export interface FeedProduct {
  product: UnifiedProduct
  feedStatuses: {
    platform: string
    status: 'valid' | 'warning' | 'error'
    errors: string[]
  }[]
}

export interface FeedStats {
  totalFeeds: number
  healthyFeeds: number
  warningFeeds: number
  errorFeeds: number
  totalProducts: number
  validProducts: number
  productsWithIssues: number
  lastGlobalSync: string | null
}

// Validation rules per platform
const platformRules: Record<string, { field: string; check: (p: UnifiedProduct) => boolean; message: string; type: 'error' | 'warning' }[]> = {
  google_shopping: [
    { field: 'title', check: p => !p.name || p.name.length < 30, message: 'Titre < 30 caractères', type: 'error' },
    { field: 'title', check: p => (p.name?.length || 0) > 150, message: 'Titre > 150 caractères', type: 'warning' },
    { field: 'description', check: p => !p.description || p.description.length < 100, message: 'Description < 100 caractères', type: 'error' },
    { field: 'image', check: p => !p.image_url && (!p.images || p.images.length === 0), message: 'Image manquante', type: 'error' },
    { field: 'price', check: p => !p.price || p.price <= 0, message: 'Prix invalide', type: 'error' },
    { field: 'gtin', check: p => !p.sku, message: 'GTIN/SKU manquant', type: 'warning' },
    { field: 'category', check: p => !p.category, message: 'Catégorie Google manquante', type: 'error' },
    { field: 'availability', check: p => p.stock_quantity === undefined, message: 'Disponibilité non définie', type: 'warning' },
  ],
  facebook_catalog: [
    { field: 'title', check: p => !p.name, message: 'Titre manquant', type: 'error' },
    { field: 'title', check: p => (p.name?.length || 0) > 200, message: 'Titre trop long', type: 'warning' },
    { field: 'description', check: p => !p.description, message: 'Description manquante', type: 'error' },
    { field: 'image', check: p => !p.image_url && (!p.images || p.images.length === 0), message: 'Image requise', type: 'error' },
    { field: 'price', check: p => !p.price || p.price <= 0, message: 'Prix invalide', type: 'error' },
    { field: 'category', check: p => !p.category, message: 'Catégorie produit manquante', type: 'warning' },
  ],
  amazon: [
    { field: 'title', check: p => !p.name || p.name.length < 50, message: 'Titre trop court pour Amazon', type: 'warning' },
    { field: 'description', check: p => !p.description || p.description.length < 200, message: 'Description insuffisante', type: 'error' },
    { field: 'image', check: p => !p.image_url && (!p.images || p.images.length === 0), message: 'Image principale requise', type: 'error' },
    { field: 'images', check: p => (p.images?.length || 0) < 3, message: '< 3 images', type: 'warning' },
    { field: 'price', check: p => !p.price, message: 'Prix requis', type: 'error' },
    { field: 'sku', check: p => !p.sku, message: 'SKU Amazon requis', type: 'error' },
    { field: 'category', check: p => !p.category, message: 'Browse node requis', type: 'error' },
  ],
  criteo: [
    { field: 'id', check: p => !p.id, message: 'ID produit manquant', type: 'error' },
    { field: 'title', check: p => !p.name, message: 'Titre requis', type: 'error' },
    { field: 'price', check: p => !p.price, message: 'Prix requis', type: 'error' },
    { field: 'image', check: p => !p.image_url, message: 'Image requise', type: 'error' },
  ],
  bing: [
    { field: 'title', check: p => !p.name || p.name.length < 25, message: 'Titre trop court', type: 'error' },
    { field: 'description', check: p => !p.description, message: 'Description requise', type: 'error' },
    { field: 'price', check: p => !p.price, message: 'Prix requis', type: 'error' },
    { field: 'image', check: p => !p.image_url, message: 'Image requise', type: 'error' },
  ],
  pinterest: [
    { field: 'title', check: p => !p.name, message: 'Titre requis', type: 'error' },
    { field: 'description', check: p => !p.description, message: 'Description requise', type: 'warning' },
    { field: 'image', check: p => !p.image_url, message: 'Image haute résolution requise', type: 'error' },
    { field: 'price', check: p => !p.price, message: 'Prix requis', type: 'error' },
  ],
  tiktok: [
    { field: 'title', check: p => !p.name, message: 'Titre produit requis', type: 'error' },
    { field: 'image', check: p => !p.image_url, message: 'Image carrée recommandée', type: 'warning' },
    { field: 'price', check: p => !p.price, message: 'Prix requis', type: 'error' },
    { field: 'category', check: p => !p.category, message: 'Catégorie TikTok requise', type: 'warning' },
  ]
}

function validateProductForPlatform(product: UnifiedProduct, platform: string): { status: 'valid' | 'warning' | 'error'; errors: string[] } {
  const rules = platformRules[platform] || []
  const errors: string[] = []
  let hasError = false
  let hasWarning = false

  rules.forEach(rule => {
    if (rule.check(product)) {
      errors.push(rule.message)
      if (rule.type === 'error') hasError = true
      else hasWarning = true
    }
  })

  return {
    status: hasError ? 'error' : hasWarning ? 'warning' : 'valid',
    errors
  }
}

export function useAuditFeed() {
  const { products, isLoading, error, refetch } = useUnifiedProducts()
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)

  // Define available channels
  const channels: { id: string; name: string; platform: FeedChannel['platform']; icon: string }[] = [
    { id: 'google', name: 'Google Shopping', platform: 'google_shopping', icon: '🛒' },
    { id: 'facebook', name: 'Facebook Catalog', platform: 'facebook_catalog', icon: '📘' },
    { id: 'amazon', name: 'Amazon Seller', platform: 'amazon', icon: '📦' },
    { id: 'criteo', name: 'Criteo', platform: 'criteo', icon: '🎯' },
    { id: 'bing', name: 'Bing Shopping', platform: 'bing', icon: '🔍' },
    { id: 'pinterest', name: 'Pinterest', platform: 'pinterest', icon: '📌' },
    { id: 'tiktok', name: 'TikTok Shop', platform: 'tiktok', icon: '🎵' },
  ]

  const feedChannels = useMemo((): FeedChannel[] => {
    return channels.map(channel => {
      const validationErrorsMap = new Map<string, FeedValidationError>()
      let validCount = 0
      let warningCount = 0
      let errorCount = 0

      products.forEach(product => {
        const result = validateProductForPlatform(product, channel.platform)
        
        if (result.status === 'valid') {
          validCount++
        } else if (result.status === 'warning') {
          warningCount++
        } else {
          errorCount++
        }

        // Aggregate errors
        result.errors.forEach(errMsg => {
          const existing = validationErrorsMap.get(errMsg)
          if (existing) {
            existing.affectedProducts++
            existing.productIds.push(product.id)
          } else {
            validationErrorsMap.set(errMsg, {
              type: result.status === 'error' ? 'error' : 'warning',
              field: errMsg.split(' ')[0].toLowerCase(),
              message: errMsg,
              affectedProducts: 1,
              productIds: [product.id],
              fixSuggestion: `Corrigez ${errMsg.toLowerCase()} pour optimiser votre feed`
            })
          }
        })
      })

      const status: FeedChannel['status'] = 
        errorCount > 0 ? 'error' : 
        warningCount > 0 ? 'warning' : 
        products.length === 0 ? 'pending' : 'valid'

      return {
        id: channel.id,
        name: channel.name,
        platform: channel.platform,
        icon: channel.icon,
        status,
        productsTotal: products.length,
        productsValid: validCount,
        productsWarning: warningCount,
        productsError: errorCount,
        lastSync: new Date().toISOString(),
        nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        validationErrors: Array.from(validationErrorsMap.values())
          .sort((a, b) => b.affectedProducts - a.affectedProducts)
      }
    })
  }, [products])

  const feedProducts = useMemo((): FeedProduct[] => {
    return products.map(product => ({
      product,
      feedStatuses: channels.map(channel => {
        const result = validateProductForPlatform(product, channel.platform)
        return {
          platform: channel.name,
          status: result.status,
          errors: result.errors
        }
      })
    }))
  }, [products])

  const stats = useMemo((): FeedStats => {
    const healthyFeeds = feedChannels.filter(f => f.status === 'valid').length
    const warningFeeds = feedChannels.filter(f => f.status === 'warning').length
    const errorFeeds = feedChannels.filter(f => f.status === 'error').length

    const validProducts = new Set<string>()
    const productsWithIssues = new Set<string>()

    feedProducts.forEach(fp => {
      const hasAnyError = fp.feedStatuses.some(s => s.status === 'error')
      const hasAnyWarning = fp.feedStatuses.some(s => s.status === 'warning')
      
      if (!hasAnyError && !hasAnyWarning) {
        validProducts.add(fp.product.id)
      } else {
        productsWithIssues.add(fp.product.id)
      }
    })

    return {
      totalFeeds: feedChannels.length,
      healthyFeeds,
      warningFeeds,
      errorFeeds,
      totalProducts: products.length,
      validProducts: validProducts.size,
      productsWithIssues: productsWithIssues.size,
      lastGlobalSync: new Date().toISOString()
    }
  }, [feedChannels, feedProducts, products.length])

  const selectedChannelData = useMemo(() => {
    if (!selectedChannel) return null
    return feedChannels.find(c => c.id === selectedChannel)
  }, [selectedChannel, feedChannels])

  return {
    feedChannels,
    feedProducts,
    stats,
    isLoading,
    error,
    refetch,
    selectedChannel,
    setSelectedChannel,
    selectedChannelData
  }
}
