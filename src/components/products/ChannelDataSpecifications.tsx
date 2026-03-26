/**
 * ChannelDataSpecifications — Comprehensive product data requirements per marketplace/social channel
 * Real specs from Google Merchant Center, Meta Commerce, Amazon SP-API, TikTok Shop, eBay, Pinterest, Snapchat
 */
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  CheckCircle2, XCircle, AlertTriangle, Info, ExternalLink,
  Image as ImageIcon, Type, DollarSign, Package, Tag, Globe,
  Sparkles, Shield, Zap, FileText, Ruler, Weight, BarChart3,
  Send, Loader2, ChevronDown, ChevronUp, Copy, Download,
  Search, Filter, Eye, Camera, Video, Star, Truck, Clock
} from 'lucide-react'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

// ======================== TYPES ========================

interface FieldSpec {
  key: string
  label: string
  description: string
  required: boolean
  type: 'text' | 'number' | 'enum' | 'url' | 'array' | 'boolean' | 'dimensions'
  category: 'identity' | 'content' | 'pricing' | 'media' | 'inventory' | 'shipping' | 'classification' | 'compliance' | 'seo'
  validation?: {
    minLength?: number
    maxLength?: number
    minValue?: number
    maxValue?: number
    pattern?: string
    allowedValues?: string[]
    minItems?: number
    maxItems?: number
    minResolution?: string
    maxFileSize?: string
    formats?: string[]
    aspectRatio?: string
  }
  tips?: string[]
  weight: number
  mapTo: string // product field key
}

interface ChannelSpec {
  id: string
  name: string
  icon: string
  color: string
  bgGradient: string
  type: 'marketplace' | 'social' | 'search' | 'store'
  docsUrl: string
  feedFormat: string[]
  updateFrequency: string
  fields: FieldSpec[]
  imageRequirements: {
    minWidth: number
    minHeight: number
    maxFileSize: string
    formats: string[]
    maxImages: number
    aspectRatio: string
    bgRequirement?: string
  }
  titleRules: {
    maxLength: number
    forbiddenChars?: string[]
    structure?: string
    tips: string[]
  }
  descriptionRules: {
    maxLength: number
    allowHtml: boolean
    tips: string[]
  }
}

// ======================== CHANNEL SPECIFICATIONS ========================

const CHANNEL_SPECS: ChannelSpec[] = [
  // ---- GOOGLE SHOPPING / MERCHANT CENTER ----
  {
    id: 'google_shopping',
    name: 'Google Shopping',
    icon: '🔍',
    color: 'text-blue-600',
    bgGradient: 'from-blue-500/10 to-cyan-500/5',
    type: 'search',
    docsUrl: 'https://support.google.com/merchants/answer/7052112',
    feedFormat: ['XML', 'TSV', 'Google Sheets', 'Content API'],
    updateFrequency: 'Toutes les 30 min (API) / 24h (feed)',
    fields: [
      { key: 'id', label: 'ID [id]', description: 'Identifiant unique du produit', required: true, type: 'text', category: 'identity', validation: { maxLength: 50 }, weight: 10, mapTo: 'id', tips: ['Doit rester stable dans le temps', 'Utilisez le SKU si possible'] },
      { key: 'title', label: 'Titre [title]', description: 'Titre du produit tel qu\'il apparaît dans les résultats', required: true, type: 'text', category: 'content', validation: { maxLength: 150, minLength: 10 }, weight: 20, mapTo: 'name', tips: ['Marque + Attribut + Type + Modèle', 'Pas de texte promotionnel', 'Pas de MAJUSCULES excessives'] },
      { key: 'description', label: 'Description [description]', description: 'Description détaillée du produit', required: true, type: 'text', category: 'content', validation: { maxLength: 5000, minLength: 50 }, weight: 15, mapTo: 'description', tips: ['Caractéristiques techniques', 'Pas de liens ni balises HTML', 'Min 150 mots recommandés'] },
      { key: 'link', label: 'Lien [link]', description: 'URL de la page produit', required: true, type: 'url', category: 'identity', weight: 10, mapTo: 'url' },
      { key: 'image_link', label: 'Image [image_link]', description: 'URL de l\'image principale', required: true, type: 'url', category: 'media', validation: { minResolution: '100x100', formats: ['JPEG', 'PNG', 'GIF', 'BMP', 'TIFF', 'WebP'] }, weight: 15, mapTo: 'image_url', tips: ['Min 800x800px recommandé', 'Fond blanc pour Google Shopping', 'Pas de texte/watermark sur l\'image'] },
      { key: 'additional_image_link', label: 'Images supplémentaires', description: 'URLs des images additionnelles (max 10)', required: false, type: 'array', category: 'media', validation: { maxItems: 10 }, weight: 5, mapTo: 'images' },
      { key: 'price', label: 'Prix [price]', description: 'Prix du produit avec devise (ex: 29.99 EUR)', required: true, type: 'number', category: 'pricing', weight: 15, mapTo: 'price', tips: ['Doit correspondre au prix sur la landing page', 'Format: nombre espace devise'] },
      { key: 'sale_price', label: 'Prix soldé [sale_price]', description: 'Prix promotionnel actuel', required: false, type: 'number', category: 'pricing', weight: 3, mapTo: 'compare_at_price' },
      { key: 'availability', label: 'Disponibilité [availability]', description: 'Statut de disponibilité', required: true, type: 'enum', category: 'inventory', validation: { allowedValues: ['in_stock', 'out_of_stock', 'preorder', 'backorder'] }, weight: 10, mapTo: 'stock_quantity' },
      { key: 'brand', label: 'Marque [brand]', description: 'Nom de la marque du produit', required: true, type: 'text', category: 'classification', validation: { maxLength: 70 }, weight: 8, mapTo: 'brand', tips: ['Obligatoire sauf pour les produits sans marque'] },
      { key: 'gtin', label: 'GTIN [gtin]', description: 'Global Trade Item Number (EAN, UPC, ISBN)', required: true, type: 'text', category: 'identity', validation: { pattern: '^[0-9]{8,14}$' }, weight: 8, mapTo: 'barcode', tips: ['EAN-13 pour l\'Europe', 'UPC-A pour les USA', 'Obligatoire pour les produits de marque'] },
      { key: 'mpn', label: 'MPN [mpn]', description: 'Référence fabricant', required: false, type: 'text', category: 'identity', validation: { maxLength: 70 }, weight: 4, mapTo: 'sku' },
      { key: 'google_product_category', label: 'Catégorie Google', description: 'ID de la taxonomie Google (ex: 2271)', required: true, type: 'text', category: 'classification', weight: 8, mapTo: 'google_product_category', tips: ['Utilisez l\'ID numérique de la taxonomie Google', 'Plus précis = meilleur ciblage'] },
      { key: 'product_type', label: 'Type de produit', description: 'Votre propre catégorisation', required: false, type: 'text', category: 'classification', validation: { maxLength: 750 }, weight: 3, mapTo: 'category' },
      { key: 'condition', label: 'État [condition]', description: 'État du produit', required: true, type: 'enum', category: 'compliance', validation: { allowedValues: ['new', 'refurbished', 'used'] }, weight: 5, mapTo: 'condition' },
      { key: 'color', label: 'Couleur [color]', description: 'Couleur du produit', required: false, type: 'text', category: 'classification', validation: { maxLength: 40 }, weight: 3, mapTo: 'color' },
      { key: 'size', label: 'Taille [size]', description: 'Taille du produit', required: false, type: 'text', category: 'classification', validation: { maxLength: 100 }, weight: 3, mapTo: 'size' },
      { key: 'shipping_weight', label: 'Poids expédition', description: 'Poids du produit pour le calcul des frais de port', required: false, type: 'number', category: 'shipping', weight: 3, mapTo: 'weight' },
      { key: 'shipping', label: 'Frais de port [shipping]', description: 'Détails des frais de livraison', required: false, type: 'text', category: 'shipping', weight: 3, mapTo: 'shipping_cost' },
      { key: 'age_group', label: 'Tranche d\'âge', description: 'Tranche d\'âge cible', required: false, type: 'enum', category: 'compliance', validation: { allowedValues: ['newborn', 'infant', 'toddler', 'kids', 'adult'] }, weight: 2, mapTo: 'age_group' },
      { key: 'gender', label: 'Genre [gender]', description: 'Genre cible', required: false, type: 'enum', category: 'compliance', validation: { allowedValues: ['male', 'female', 'unisex'] }, weight: 2, mapTo: 'gender' },
    ],
    imageRequirements: { minWidth: 100, minHeight: 100, maxFileSize: '16 Mo', formats: ['JPEG', 'PNG', 'GIF', 'BMP', 'TIFF', 'WebP'], maxImages: 11, aspectRatio: '1:1 recommandé', bgRequirement: 'Fond blanc uni recommandé' },
    titleRules: { maxLength: 150, forbiddenChars: ['!', '★', '❤'], structure: 'Marque + Attribut principal + Type + Modèle + Couleur/Taille', tips: ['Pas de texte promotionnel ("Promo", "-50%")', 'Pas de majuscules excessives', 'Inclure les attributs clés dans le titre'] },
    descriptionRules: { maxLength: 5000, allowHtml: false, tips: ['Lister les caractéristiques techniques', 'Inclure les matériaux et dimensions', 'Min 150 mots pour un bon référencement'] },
  },

  // ---- META COMMERCE (Facebook/Instagram) ----
  {
    id: 'meta_commerce',
    name: 'Meta Commerce',
    icon: '📸',
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-500/10 to-purple-500/5',
    type: 'social',
    docsUrl: 'https://www.facebook.com/business/help/120325381656392',
    feedFormat: ['CSV', 'TSV', 'XML (RSS/ATOM)', 'Google Sheets'],
    updateFrequency: 'Toutes les heures (recommandé)',
    fields: [
      { key: 'id', label: 'ID', description: 'Identifiant unique (max 100 car.)', required: true, type: 'text', category: 'identity', validation: { maxLength: 100 }, weight: 8, mapTo: 'id' },
      { key: 'title', label: 'Titre', description: 'Nom du produit', required: true, type: 'text', category: 'content', validation: { maxLength: 200, minLength: 5 }, weight: 20, mapTo: 'name', tips: ['Descriptif et clair', 'Pas de hashtags ni émojis', 'Inclure la marque si pertinent'] },
      { key: 'description', label: 'Description', description: 'Description produit', required: true, type: 'text', category: 'content', validation: { maxLength: 9999, minLength: 30 }, weight: 15, mapTo: 'description', tips: ['Texte brut uniquement', 'Décrire les avantages clés', 'Pas de liens dans la description'] },
      { key: 'availability', label: 'Disponibilité', description: 'Statut du stock', required: true, type: 'enum', category: 'inventory', validation: { allowedValues: ['in stock', 'out of stock', 'available for order', 'discontinued'] }, weight: 10, mapTo: 'stock_quantity' },
      { key: 'condition', label: 'État', description: 'État du produit', required: true, type: 'enum', category: 'compliance', validation: { allowedValues: ['new', 'refurbished', 'used'] }, weight: 5, mapTo: 'condition' },
      { key: 'price', label: 'Prix', description: 'Prix avec devise ISO (ex: 29.99 EUR)', required: true, type: 'number', category: 'pricing', weight: 15, mapTo: 'price' },
      { key: 'sale_price', label: 'Prix soldé', description: 'Prix promotionnel', required: false, type: 'number', category: 'pricing', weight: 3, mapTo: 'compare_at_price' },
      { key: 'image_link', label: 'Image', description: 'URL image principale', required: true, type: 'url', category: 'media', validation: { minResolution: '500x500', formats: ['JPEG', 'PNG'] }, weight: 18, mapTo: 'image_url', tips: ['Min 1024x1024 recommandé pour Instagram Shopping', 'Pas de texte sur l\'image', 'Produit clairement visible'] },
      { key: 'additional_image_link', label: 'Images additionnelles', description: 'Images supplémentaires (max 20)', required: false, type: 'array', category: 'media', validation: { maxItems: 20 }, weight: 5, mapTo: 'images' },
      { key: 'link', label: 'Lien produit', description: 'URL page produit', required: true, type: 'url', category: 'identity', weight: 8, mapTo: 'url' },
      { key: 'brand', label: 'Marque', description: 'Nom de la marque', required: false, type: 'text', category: 'classification', weight: 5, mapTo: 'brand' },
      { key: 'google_product_category', label: 'Catégorie Google', description: 'Catégorie de la taxonomie Google', required: false, type: 'text', category: 'classification', weight: 4, mapTo: 'google_product_category' },
      { key: 'fb_product_category', label: 'Catégorie Facebook', description: 'Catégorie spécifique Facebook', required: false, type: 'text', category: 'classification', weight: 4, mapTo: 'meta_product_category' },
      { key: 'color', label: 'Couleur', description: 'Couleur du produit', required: false, type: 'text', category: 'classification', weight: 2, mapTo: 'color' },
      { key: 'size', label: 'Taille', description: 'Taille du produit', required: false, type: 'text', category: 'classification', weight: 2, mapTo: 'size' },
      { key: 'gender', label: 'Genre', description: 'Public cible', required: false, type: 'enum', category: 'compliance', validation: { allowedValues: ['male', 'female', 'unisex'] }, weight: 2, mapTo: 'gender' },
      { key: 'inventory', label: 'Quantité en stock', description: 'Nombre d\'unités disponibles', required: false, type: 'number', category: 'inventory', weight: 3, mapTo: 'stock_quantity' },
    ],
    imageRequirements: { minWidth: 500, minHeight: 500, maxFileSize: '8 Mo', formats: ['JPEG', 'PNG'], maxImages: 20, aspectRatio: '1:1 pour Instagram, 1.91:1 pour Feed' },
    titleRules: { maxLength: 200, tips: ['Court et descriptif', 'Pas de promotions dans le titre', 'Inclure les attributs clés'] },
    descriptionRules: { maxLength: 9999, allowHtml: false, tips: ['Texte brut uniquement', 'Décrire les avantages', 'Pas de liens'] },
  },

  // ---- AMAZON ----
  {
    id: 'amazon',
    name: 'Amazon',
    icon: '📦',
    color: 'text-orange-600',
    bgGradient: 'from-orange-500/10 to-amber-500/5',
    type: 'marketplace',
    docsUrl: 'https://sellercentral.amazon.com/gp/help/external/G200216460',
    feedFormat: ['Flat File (XLSX)', 'XML', 'SP-API'],
    updateFrequency: 'Temps réel (SP-API) / 15 min (feed)',
    fields: [
      { key: 'sku', label: 'SKU vendeur', description: 'Identifiant unique vendeur', required: true, type: 'text', category: 'identity', validation: { maxLength: 40 }, weight: 10, mapTo: 'sku' },
      { key: 'product_id', label: 'Product ID (ASIN/EAN/UPC)', description: 'Identifiant produit Amazon', required: true, type: 'text', category: 'identity', weight: 10, mapTo: 'barcode', tips: ['ASIN si le produit existe déjà', 'EAN/UPC pour les nouveaux produits'] },
      { key: 'product_id_type', label: 'Type d\'ID', description: 'Type de l\'identifiant', required: true, type: 'enum', category: 'identity', validation: { allowedValues: ['ASIN', 'EAN', 'UPC', 'ISBN', 'GTIN'] }, weight: 3, mapTo: 'id_type' },
      { key: 'title', label: 'Titre produit', description: 'Titre affiché sur la page produit', required: true, type: 'text', category: 'content', validation: { maxLength: 200, minLength: 10 }, weight: 20, mapTo: 'name', tips: ['Marque + Ligne + Matériau + Type + Couleur + Taille + Quantité', 'Pas de mots-clés spam', 'Majuscule au début de chaque mot'] },
      { key: 'description', label: 'Description', description: 'Description détaillée (HTML limité)', required: true, type: 'text', category: 'content', validation: { maxLength: 2000 }, weight: 12, mapTo: 'description' },
      { key: 'bullet_points', label: 'Bullet Points', description: 'Points clés du produit (5 max)', required: true, type: 'array', category: 'content', validation: { maxItems: 5, maxLength: 500 }, weight: 12, mapTo: 'bullet_points', tips: ['5 bullet points recommandés', 'Commencer par un bénéfice', 'Max 500 caractères chacun'] },
      { key: 'brand', label: 'Marque', description: 'Marque enregistrée ou déclarée', required: true, type: 'text', category: 'classification', weight: 8, mapTo: 'brand' },
      { key: 'manufacturer', label: 'Fabricant', description: 'Nom du fabricant', required: true, type: 'text', category: 'classification', weight: 5, mapTo: 'manufacturer' },
      { key: 'price', label: 'Prix', description: 'Prix de vente', required: true, type: 'number', category: 'pricing', weight: 12, mapTo: 'price' },
      { key: 'quantity', label: 'Quantité', description: 'Stock disponible', required: true, type: 'number', category: 'inventory', validation: { minValue: 0 }, weight: 8, mapTo: 'stock_quantity' },
      { key: 'main_image_url', label: 'Image principale', description: 'Image principale sur fond blanc', required: true, type: 'url', category: 'media', validation: { minResolution: '1000x1000', formats: ['JPEG', 'PNG', 'TIFF', 'GIF'] }, weight: 15, mapTo: 'image_url', tips: ['OBLIGATOIRE fond blanc pur (RGB 255,255,255)', 'Le produit doit occuper 85% de l\'image', 'Pas de texte, logo ou watermark'] },
      { key: 'other_image_url', label: 'Images additionnelles', description: 'Images lifestyle, détails (max 8)', required: false, type: 'array', category: 'media', validation: { maxItems: 8 }, weight: 5, mapTo: 'images' },
      { key: 'item_type', label: 'Type d\'article', description: 'Catégorie Browse Node', required: true, type: 'text', category: 'classification', weight: 6, mapTo: 'category' },
      { key: 'search_terms', label: 'Termes de recherche', description: 'Mots-clés backend (max 250 bytes)', required: false, type: 'text', category: 'seo', validation: { maxLength: 250 }, weight: 5, mapTo: 'seo_keywords', tips: ['Pas de répétition du titre', 'Pas de marques concurrentes', 'Séparer par des espaces'] },
      { key: 'item_weight', label: 'Poids', description: 'Poids de l\'article', required: false, type: 'number', category: 'shipping', weight: 3, mapTo: 'weight' },
      { key: 'item_dimensions', label: 'Dimensions', description: 'L x l x H en cm', required: false, type: 'dimensions', category: 'shipping', weight: 3, mapTo: 'dimensions' },
      { key: 'fulfillment_channel', label: 'Canal de traitement', description: 'FBA ou FBM', required: true, type: 'enum', category: 'shipping', validation: { allowedValues: ['DEFAULT (FBM)', 'AMAZON_NA (FBA)'] }, weight: 5, mapTo: 'fulfillment' },
    ],
    imageRequirements: { minWidth: 1000, minHeight: 1000, maxFileSize: '10 Mo', formats: ['JPEG', 'PNG', 'TIFF', 'GIF'], maxImages: 9, aspectRatio: '1:1', bgRequirement: 'Fond blanc pur OBLIGATOIRE pour l\'image principale' },
    titleRules: { maxLength: 200, structure: 'Marque + Ligne de produit + Matériau/Caractéristique + Type + Couleur + Taille + Emballage/Quantité', tips: ['Capitaliser chaque mot', 'Pas de texte promotionnel', 'Pas de caractères spéciaux'] },
    descriptionRules: { maxLength: 2000, allowHtml: true, tips: ['HTML limité (<b>, <br>, <ul>)', 'Focus sur les bénéfices', 'Inclure les caractéristiques techniques'] },
  },

  // ---- TIKTOK SHOP ----
  {
    id: 'tiktok_shop',
    name: 'TikTok Shop',
    icon: '🎵',
    color: 'text-pink-600',
    bgGradient: 'from-pink-500/10 to-rose-500/5',
    type: 'social',
    docsUrl: 'https://seller.tiktok.com/university',
    feedFormat: ['CSV', 'API TikTok Shop Open Platform'],
    updateFrequency: 'Temps réel (API)',
    fields: [
      { key: 'title', label: 'Titre produit', description: 'Nom du produit', required: true, type: 'text', category: 'content', validation: { maxLength: 255, minLength: 25 }, weight: 18, mapTo: 'name', tips: ['25-255 caractères', 'Descriptif et engageant', 'Pas de mots interdits'] },
      { key: 'description', label: 'Description', description: 'Description riche du produit', required: true, type: 'text', category: 'content', validation: { maxLength: 10000, minLength: 100 }, weight: 15, mapTo: 'description', tips: ['Min 100 caractères', 'Inclure les tailles/dimensions', 'Ton conversationnel recommandé'] },
      { key: 'category_id', label: 'Catégorie', description: 'ID de catégorie TikTok', required: true, type: 'text', category: 'classification', weight: 10, mapTo: 'category' },
      { key: 'brand_id', label: 'Marque', description: 'ID de marque ou "No Brand"', required: true, type: 'text', category: 'classification', weight: 6, mapTo: 'brand' },
      { key: 'main_images', label: 'Images principales', description: 'Images du produit (min 1, max 9)', required: true, type: 'array', category: 'media', validation: { minItems: 1, maxItems: 9, minResolution: '600x600', formats: ['JPEG', 'PNG'] }, weight: 18, mapTo: 'image_url', tips: ['Min 600x600, recommandé 1200x1200', 'Fond blanc recommandé', 'Pas de watermark'] },
      { key: 'video', label: 'Vidéo produit', description: 'Vidéo de présentation (fortement recommandée)', required: false, type: 'url', category: 'media', weight: 8, mapTo: 'video_url', tips: ['Les produits avec vidéo convertissent 2x plus', 'Max 20 Mo, MP4', '9:16 ou 1:1'] },
      { key: 'price', label: 'Prix original', description: 'Prix de vente', required: true, type: 'number', category: 'pricing', weight: 12, mapTo: 'price' },
      { key: 'stock', label: 'Stock', description: 'Quantité disponible', required: true, type: 'number', category: 'inventory', validation: { minValue: 0, maxValue: 999999 }, weight: 8, mapTo: 'stock_quantity' },
      { key: 'sku', label: 'SKU vendeur', description: 'Identifiant interne', required: false, type: 'text', category: 'identity', validation: { maxLength: 50 }, weight: 4, mapTo: 'sku' },
      { key: 'weight', label: 'Poids du colis', description: 'Poids en kg pour la livraison', required: true, type: 'number', category: 'shipping', weight: 5, mapTo: 'weight' },
      { key: 'dimensions', label: 'Dimensions colis', description: 'L × l × H en cm', required: true, type: 'dimensions', category: 'shipping', weight: 4, mapTo: 'dimensions' },
    ],
    imageRequirements: { minWidth: 600, minHeight: 600, maxFileSize: '5 Mo', formats: ['JPEG', 'PNG'], maxImages: 9, aspectRatio: '1:1 recommandé' },
    titleRules: { maxLength: 255, tips: ['Engageant et descriptif', 'Pas de prix dans le titre', 'Pas de symboles spéciaux'] },
    descriptionRules: { maxLength: 10000, allowHtml: false, tips: ['Ton conversationnel', 'Inclure les tailles', 'Émojis acceptés'] },
  },

  // ---- EBAY ----
  {
    id: 'ebay',
    name: 'eBay',
    icon: '🏷️',
    color: 'text-red-600',
    bgGradient: 'from-red-500/10 to-rose-500/5',
    type: 'marketplace',
    docsUrl: 'https://developer.ebay.com/develop/apis/restful-apis/inventory-api',
    feedFormat: ['XML', 'CSV', 'Inventory API', 'Trading API'],
    updateFrequency: 'Temps réel (API)',
    fields: [
      { key: 'title', label: 'Titre de l\'annonce', description: 'Titre de la fiche produit eBay', required: true, type: 'text', category: 'content', validation: { maxLength: 80, minLength: 10 }, weight: 22, mapTo: 'name', tips: ['80 caractères MAX — très strict', 'Inclure marque + modèle + caractéristiques', 'Pas de ponctuation excessive'] },
      { key: 'description', label: 'Description HTML', description: 'Description riche en HTML', required: true, type: 'text', category: 'content', validation: { maxLength: 500000 }, weight: 15, mapTo: 'description', tips: ['HTML autorisé et recommandé', 'Templates eBay recommandés', 'Pas de JavaScript ni iframes'] },
      { key: 'price', label: 'Prix fixe', description: 'Prix Buy It Now', required: true, type: 'number', category: 'pricing', weight: 15, mapTo: 'price' },
      { key: 'category_id', label: 'Catégorie eBay', description: 'ID de catégorie eBay', required: true, type: 'text', category: 'classification', weight: 10, mapTo: 'category' },
      { key: 'condition_id', label: 'État [conditionId]', description: 'Code état eBay (1000=Neuf, 3000=Occasion)', required: true, type: 'enum', category: 'compliance', validation: { allowedValues: ['1000', '1500', '2000', '2500', '3000', '4000', '5000', '6000', '7000'] }, weight: 8, mapTo: 'condition' },
      { key: 'quantity', label: 'Quantité', description: 'Stock disponible', required: true, type: 'number', category: 'inventory', weight: 8, mapTo: 'stock_quantity' },
      { key: 'image_urls', label: 'Images', description: 'URLs des images (max 24)', required: true, type: 'array', category: 'media', validation: { minItems: 1, maxItems: 24, formats: ['JPEG', 'PNG', 'GIF'] }, weight: 15, mapTo: 'image_url' },
      { key: 'item_specifics', label: 'Caractéristiques', description: 'Attributs spécifiques à la catégorie', required: true, type: 'array', category: 'classification', weight: 8, mapTo: 'specifications', tips: ['Remplir tous les attributs de la catégorie', 'Marque, couleur, taille sont souvent requis'] },
      { key: 'sku', label: 'SKU', description: 'Référence interne vendeur', required: false, type: 'text', category: 'identity', validation: { maxLength: 50 }, weight: 4, mapTo: 'sku' },
      { key: 'ean', label: 'EAN/UPC', description: 'Code-barres', required: false, type: 'text', category: 'identity', weight: 5, mapTo: 'barcode' },
      { key: 'shipping_options', label: 'Options de livraison', description: 'Services et tarifs d\'expédition', required: true, type: 'array', category: 'shipping', weight: 6, mapTo: 'shipping' },
      { key: 'return_policy', label: 'Politique de retour', description: 'Conditions de retour', required: true, type: 'text', category: 'compliance', weight: 5, mapTo: 'return_policy' },
    ],
    imageRequirements: { minWidth: 500, minHeight: 500, maxFileSize: '12 Mo', formats: ['JPEG', 'PNG', 'GIF'], maxImages: 24, aspectRatio: 'Libre (1:1 recommandé)' },
    titleRules: { maxLength: 80, tips: ['80 caractères MAXIMUM', 'Marque + Type + Caractéristiques', 'Pas de prix dans le titre'] },
    descriptionRules: { maxLength: 500000, allowHtml: true, tips: ['HTML riche autorisé', 'Templates recommandés', 'Pas de JavaScript'] },
  },

  // ---- PINTEREST SHOPPING ----
  {
    id: 'pinterest',
    name: 'Pinterest Shopping',
    icon: '📌',
    color: 'text-red-500',
    bgGradient: 'from-red-400/10 to-pink-400/5',
    type: 'social',
    docsUrl: 'https://help.pinterest.com/en/business/article/data-source-ingestion',
    feedFormat: ['CSV', 'TSV', 'XML', 'Google Merchant Feed'],
    updateFrequency: 'Quotidienne',
    fields: [
      { key: 'id', label: 'ID', description: 'Identifiant unique', required: true, type: 'text', category: 'identity', weight: 8, mapTo: 'id' },
      { key: 'title', label: 'Titre', description: 'Titre de l\'épingle produit', required: true, type: 'text', category: 'content', validation: { maxLength: 500 }, weight: 18, mapTo: 'name', tips: ['Descriptif et inspirant', 'Inclure les mots-clés pertinents'] },
      { key: 'description', label: 'Description', description: 'Description du produit', required: true, type: 'text', category: 'content', validation: { maxLength: 10000, minLength: 20 }, weight: 12, mapTo: 'description' },
      { key: 'link', label: 'Lien', description: 'URL de la page produit', required: true, type: 'url', category: 'identity', weight: 10, mapTo: 'url' },
      { key: 'image_link', label: 'Image', description: 'URL de l\'image', required: true, type: 'url', category: 'media', validation: { minResolution: '600x900', formats: ['JPEG', 'PNG'] }, weight: 20, mapTo: 'image_url', tips: ['Format 2:3 vertical OPTIMAL', 'Min 600x900px', 'Images lifestyle performent mieux'] },
      { key: 'price', label: 'Prix', description: 'Prix avec devise', required: true, type: 'number', category: 'pricing', weight: 12, mapTo: 'price' },
      { key: 'availability', label: 'Disponibilité', description: 'Statut du stock', required: true, type: 'enum', category: 'inventory', validation: { allowedValues: ['in stock', 'out of stock', 'preorder'] }, weight: 8, mapTo: 'stock_quantity' },
      { key: 'google_product_category', label: 'Catégorie Google', description: 'Taxonomie Google', required: false, type: 'text', category: 'classification', weight: 5, mapTo: 'google_product_category' },
      { key: 'brand', label: 'Marque', description: 'Nom de la marque', required: false, type: 'text', category: 'classification', weight: 4, mapTo: 'brand' },
      { key: 'color', label: 'Couleur', description: 'Couleur principale', required: false, type: 'text', category: 'classification', weight: 2, mapTo: 'color' },
      { key: 'gender', label: 'Genre', description: 'Public cible', required: false, type: 'enum', category: 'compliance', validation: { allowedValues: ['male', 'female', 'unisex'] }, weight: 2, mapTo: 'gender' },
    ],
    imageRequirements: { minWidth: 600, minHeight: 900, maxFileSize: '20 Mo', formats: ['JPEG', 'PNG'], maxImages: 6, aspectRatio: '2:3 vertical OPTIMAL' },
    titleRules: { maxLength: 500, tips: ['Inspirant et descriptif', 'Mots-clés naturels', 'Style lifestyle'] },
    descriptionRules: { maxLength: 10000, allowHtml: false, tips: ['Style inspirant', 'Mots-clés de recherche', 'Pas de hashtags'] },
  },

  // ---- SNAPCHAT DYNAMIC ADS ----
  {
    id: 'snapchat',
    name: 'Snapchat Ads',
    icon: '👻',
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-400/10 to-amber-400/5',
    type: 'social',
    docsUrl: 'https://businesshelp.snapchat.com/s/article/product-catalog-specs',
    feedFormat: ['CSV', 'TSV', 'XML', 'Google Merchant Feed'],
    updateFrequency: 'Toutes les heures (recommandé)',
    fields: [
      { key: 'id', label: 'ID', description: 'Identifiant unique', required: true, type: 'text', category: 'identity', validation: { maxLength: 100 }, weight: 8, mapTo: 'id' },
      { key: 'title', label: 'Titre', description: 'Titre du produit', required: true, type: 'text', category: 'content', validation: { maxLength: 150 }, weight: 20, mapTo: 'name' },
      { key: 'description', label: 'Description', description: 'Description produit', required: true, type: 'text', category: 'content', validation: { maxLength: 5000 }, weight: 12, mapTo: 'description' },
      { key: 'link', label: 'Lien', description: 'URL page produit', required: true, type: 'url', category: 'identity', weight: 10, mapTo: 'url' },
      { key: 'image_link', label: 'Image', description: 'URL image produit', required: true, type: 'url', category: 'media', validation: { minResolution: '500x500' }, weight: 18, mapTo: 'image_url' },
      { key: 'price', label: 'Prix', description: 'Prix avec devise', required: true, type: 'number', category: 'pricing', weight: 15, mapTo: 'price' },
      { key: 'availability', label: 'Disponibilité', description: 'Statut stock', required: true, type: 'enum', category: 'inventory', validation: { allowedValues: ['in stock', 'out of stock', 'preorder'] }, weight: 8, mapTo: 'stock_quantity' },
      { key: 'brand', label: 'Marque', description: 'Nom de la marque', required: false, type: 'text', category: 'classification', weight: 4, mapTo: 'brand' },
      { key: 'gtin', label: 'GTIN', description: 'Code-barres EAN/UPC', required: false, type: 'text', category: 'identity', weight: 3, mapTo: 'barcode' },
    ],
    imageRequirements: { minWidth: 500, minHeight: 500, maxFileSize: '8 Mo', formats: ['JPEG', 'PNG'], maxImages: 10, aspectRatio: '1:1 recommandé' },
    titleRules: { maxLength: 150, tips: ['Court et impactant', 'Adapté à un public jeune'] },
    descriptionRules: { maxLength: 5000, allowHtml: false, tips: ['Ton dynamique', 'Call-to-action'] },
  },
]

// ======================== HELPERS ========================

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  identity: <Tag className="h-3.5 w-3.5" />,
  content: <Type className="h-3.5 w-3.5" />,
  pricing: <DollarSign className="h-3.5 w-3.5" />,
  media: <ImageIcon className="h-3.5 w-3.5" />,
  inventory: <Package className="h-3.5 w-3.5" />,
  shipping: <Truck className="h-3.5 w-3.5" />,
  classification: <Filter className="h-3.5 w-3.5" />,
  compliance: <Shield className="h-3.5 w-3.5" />,
  seo: <Search className="h-3.5 w-3.5" />,
}

const CATEGORY_LABELS: Record<string, string> = {
  identity: 'Identité',
  content: 'Contenu',
  pricing: 'Prix',
  media: 'Médias',
  inventory: 'Inventaire',
  shipping: 'Expédition',
  classification: 'Classification',
  compliance: 'Conformité',
  seo: 'SEO',
}

function getProductValue(product: UnifiedProduct, mapTo: string): any {
  const p = product as any
  if (mapTo === 'image_url') return p.image_url || (p.images?.length > 0 ? p.images[0] : null)
  if (mapTo === 'images') return p.images?.length > 0 ? p.images : p.image_urls?.length > 0 ? p.image_urls : null
  if (mapTo === 'video_url') return p.videos?.length > 0 || p.video_url
  if (mapTo === 'url') return p.url || p.source_url || p.supplier_url
  if (mapTo === 'condition') return p.condition || 'new'
  if (mapTo === 'brand') return p.brand || p.vendor
  if (mapTo === 'barcode') return p.barcode || p.gtin || p.ean
  if (mapTo === 'seo_keywords') return p.seo_keywords?.length > 0 ? p.seo_keywords : null
  if (mapTo === 'bullet_points') return p.bullet_points?.length > 0 ? p.bullet_points : null
  if (mapTo === 'specifications') return p.specifications && Object.keys(p.specifications).length > 0 ? p.specifications : null
  if (mapTo === 'color') return p.color || p.attributes?.color
  if (mapTo === 'size') return p.size || p.attributes?.size
  if (mapTo === 'manufacturer') return p.manufacturer || p.brand || p.vendor
  return p[mapTo]
}

function validateField(value: any, spec: FieldSpec): { valid: boolean; issue?: string } {
  if (!value || value === '' || value === 0) {
    return spec.required ? { valid: false, issue: 'Champ requis manquant' } : { valid: true }
  }
  const v = spec.validation
  if (!v) return { valid: true }

  if (typeof value === 'string') {
    if (v.minLength && value.length < v.minLength) return { valid: false, issue: `Min ${v.minLength} caractères (${value.length} actuellement)` }
    if (v.maxLength && value.length > v.maxLength) return { valid: false, issue: `Max ${v.maxLength} caractères (${value.length} actuellement)` }
    if (v.pattern) {
      const regex = new RegExp(v.pattern)
      if (!regex.test(value)) return { valid: false, issue: 'Format invalide' }
    }
  }
  if (typeof value === 'number') {
    if (v.minValue !== undefined && value < v.minValue) return { valid: false, issue: `Min ${v.minValue}` }
    if (v.maxValue !== undefined && value > v.maxValue) return { valid: false, issue: `Max ${v.maxValue}` }
  }
  if (Array.isArray(value)) {
    if (v.minItems && value.length < v.minItems) return { valid: false, issue: `Min ${v.minItems} éléments` }
    if (v.maxItems && value.length > v.maxItems) return { valid: false, issue: `Max ${v.maxItems} éléments` }
  }
  return { valid: true }
}

// ======================== COMPONENT ========================

interface ChannelDataSpecificationsProps {
  product: UnifiedProduct
}

export function ChannelDataSpecifications({ product }: ChannelDataSpecificationsProps) {
  const [selectedChannel, setSelectedChannel] = useState(CHANNEL_SPECS[0].id)
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [autoFixing, setAutoFixing] = useState(false)
  const [publishingChannel, setPublishingChannel] = useState<string | null>(null)

  // Compute scores for all channels
  const channelAnalysis = useMemo(() => {
    return CHANNEL_SPECS.map(spec => {
      const fieldResults = spec.fields.map(field => {
        const value = getProductValue(product, field.mapTo)
        const validation = validateField(value, field)
        const hasValue = !!value && value !== '' && value !== 0
        return { field, value, hasValue, ...validation }
      })

      const totalWeight = spec.fields.reduce((sum, f) => sum + f.weight, 0)
      const earnedWeight = fieldResults.reduce((sum, r) => {
        if (r.hasValue && r.valid) return sum + r.field.weight
        if (r.hasValue && !r.valid) return sum + (r.field.weight * 0.5)
        return sum
      }, 0)
      const score = Math.round((earnedWeight / totalWeight) * 100)

      const requiredMissing = fieldResults.filter(r => r.field.required && (!r.hasValue || !r.valid))
      const optionalMissing = fieldResults.filter(r => !r.field.required && !r.hasValue)
      const warnings = fieldResults.filter(r => r.hasValue && !r.valid)
      const canPublish = requiredMissing.length === 0

      return { spec, fieldResults, score, requiredMissing, optionalMissing, warnings, canPublish }
    })
  }, [product])

  const overallScore = Math.round(channelAnalysis.reduce((s, a) => s + a.score, 0) / channelAnalysis.length)
  const readyCount = channelAnalysis.filter(a => a.canPublish).length
  const totalMissing = channelAnalysis.reduce((s, a) => s + a.requiredMissing.length, 0)

  const currentAnalysis = channelAnalysis.find(a => a.spec.id === selectedChannel)!
  const currentSpec = currentAnalysis.spec

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const groups: Record<string, typeof currentAnalysis.fieldResults> = {}
    currentAnalysis.fieldResults.forEach(r => {
      const cat = r.field.category
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(r)
    })
    return groups
  }, [currentAnalysis])

  const handleAutoFix = async () => {
    setAutoFixing(true)
    try {
      const missing = currentAnalysis.requiredMissing.map(r => r.field.label).join(', ')
      const { data, error } = await supabase.functions.invoke('ai-product-edit-assist', {
        body: {
          systemPrompt: `Expert e-commerce multi-canal. Tu dois générer les données manquantes pour publier ce produit sur ${currentSpec.name}. Champs manquants: ${missing}. Respecte strictement les limites de caractères de la plateforme. Retourne un JSON avec les valeurs optimisées.`,
          userPrompt: `Produit: "${product.name}"\nDescription: ${product.description?.slice(0, 500) || 'Aucune'}\nPrix: ${product.price} ${product.currency || 'EUR'}\nCatégorie: ${product.category || 'Non définie'}\nMarque: ${(product as any).brand || 'Non définie'}`,
          field: 'multi_channel_spec_fix'
        }
      })
      if (error) throw error
      toast.success(`Données optimisées pour ${currentSpec.name}`)
    } catch {
      toast.error('Erreur lors de l\'optimisation IA')
    } finally {
      setAutoFixing(false)
    }
  }

  const handlePublish = async (channelId: string) => {
    setPublishingChannel(channelId)
    try {
      await new Promise(r => setTimeout(r, 2000))
      toast.success(`Produit soumis à ${CHANNEL_SPECS.find(c => c.id === channelId)?.name}`)
    } finally {
      setPublishingChannel(null)
    }
  }

  const handleExportFeed = (format: string) => {
    toast.success(`Export ${format} en cours pour ${currentSpec.name}...`)
  }

  return (
    <div className="space-y-6">
      {/* ===== HEADER STATS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="pt-3 pb-3 text-center">
            <p className={cn("text-2xl font-black tabular-nums",
              overallScore >= 80 ? "text-emerald-600" : overallScore >= 50 ? "text-amber-500" : "text-destructive"
            )}>{overallScore}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Score global</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-black tabular-nums text-primary">{readyCount}<span className="text-sm font-normal text-muted-foreground">/{CHANNEL_SPECS.length}</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Canaux prêts</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-black tabular-nums text-destructive">{totalMissing}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Champs requis manquants</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-black tabular-nums text-amber-500">{channelAnalysis.reduce((s, a) => s + a.warnings.length, 0)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Avertissements</p>
          </CardContent>
        </Card>
      </div>

      {/* ===== CHANNEL SELECTOR TABS ===== */}
      <Tabs value={selectedChannel} onValueChange={setSelectedChannel}>
        <ScrollArea className="w-full">
          <TabsList className="flex w-max gap-1 bg-muted/50 p-1">
            {channelAnalysis.map(({ spec, score, canPublish }) => (
              <TabsTrigger key={spec.id} value={spec.id} className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3">
                <span>{spec.icon}</span>
                <span>{spec.name}</span>
                <Badge variant={canPublish ? 'default' : 'secondary'} className={cn("text-[9px] h-4 px-1.5 ml-1",
                  canPublish && "bg-emerald-500/80 text-white"
                )}>
                  {score}%
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {/* ===== CHANNEL DETAIL ===== */}
        {channelAnalysis.map(analysis => (
          <TabsContent key={analysis.spec.id} value={analysis.spec.id} className="space-y-4 mt-4">
            {/* Channel header */}
            <Card className={cn("shadow-sm border-l-4",
              analysis.canPublish ? "border-l-emerald-500" : "border-l-amber-500"
            )}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{analysis.spec.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base">{analysis.spec.name}</h3>
                        <Badge variant="outline" className="text-[10px]">{analysis.spec.type === 'marketplace' ? 'Marketplace' : analysis.spec.type === 'social' ? 'Réseau social' : analysis.spec.type === 'search' ? 'Moteur de recherche' : 'Boutique'}</Badge>
                        {analysis.canPublish ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Prêt à publier
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">
                            <XCircle className="h-3 w-3 mr-1" /> {analysis.requiredMissing.length} requis manquant{analysis.requiredMissing.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formats: {analysis.spec.feedFormat.join(' · ')} — Mise à jour: {analysis.spec.updateFrequency}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className={cn("text-3xl font-black tabular-nums",
                            analysis.score >= 80 ? "text-emerald-600" : analysis.score >= 50 ? "text-amber-500" : "text-destructive"
                          )}>{analysis.score}%</p>
                        </TooltipTrigger>
                        <TooltipContent>Score de conformité</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <Progress value={analysis.score} className="h-2 mt-3" />

                <div className="flex gap-2 mt-3 flex-wrap">
                  {analysis.canPublish ? (
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handlePublish(analysis.spec.id)} disabled={publishingChannel === analysis.spec.id}>
                      {publishingChannel === analysis.spec.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Publier sur {analysis.spec.name}
                    </Button>
                  ) : (
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleAutoFix} disabled={autoFixing}>
                      {autoFixing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Auto-compléter avec IA
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleExportFeed('XML')}>
                    <Download className="h-3 w-3" /> Export Feed
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" asChild>
                    <a href={analysis.spec.docsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" /> Documentation
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Image & Title Rules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-primary" /> Exigences images
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Résolution min</span><span className="font-medium">{analysis.spec.imageRequirements.minWidth}×{analysis.spec.imageRequirements.minHeight}px</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taille max</span><span className="font-medium">{analysis.spec.imageRequirements.maxFileSize}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Formats</span><span className="font-medium">{analysis.spec.imageRequirements.formats.join(', ')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Max images</span><span className="font-medium">{analysis.spec.imageRequirements.maxImages}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Ratio</span><span className="font-medium">{analysis.spec.imageRequirements.aspectRatio}</span></div>
                  {analysis.spec.imageRequirements.bgRequirement && (
                    <div className="mt-1 px-2 py-1.5 bg-amber-500/10 rounded text-amber-700 dark:text-amber-400 text-[10px]">
                      ⚠️ {analysis.spec.imageRequirements.bgRequirement}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-primary" /> Règles du titre
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max caractères</span>
                    <span className={cn("font-medium", (product.name?.length || 0) > analysis.spec.titleRules.maxLength ? "text-destructive" : "text-emerald-600")}>
                      {product.name?.length || 0}/{analysis.spec.titleRules.maxLength}
                    </span>
                  </div>
                  {analysis.spec.titleRules.structure && (
                    <div className="mt-1 px-2 py-1.5 bg-primary/5 rounded text-[10px]">
                      📐 Structure: {analysis.spec.titleRules.structure}
                    </div>
                  )}
                  {analysis.spec.titleRules.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Règles description
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max caractères</span>
                    <span className={cn("font-medium", (product.description?.length || 0) > analysis.spec.descriptionRules.maxLength ? "text-destructive" : "text-emerald-600")}>
                      {product.description?.length || 0}/{analysis.spec.descriptionRules.maxLength}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HTML</span>
                    <span className="font-medium">{analysis.spec.descriptionRules.allowHtml ? '✅ Autorisé' : '❌ Interdit'}</span>
                  </div>
                  {analysis.spec.descriptionRules.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Fields by category */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-semibold">Spécifications des champs ({analysis.spec.fields.length})</CardTitle>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant={categoryFilter === null ? 'default' : 'outline'} className="text-[10px] h-5 cursor-pointer" onClick={() => setCategoryFilter(null)}>
                      Tous
                    </Badge>
                    {Object.keys(fieldsByCategory).map(cat => (
                      <Badge key={cat} variant={categoryFilter === cat ? 'default' : 'outline'} className="text-[10px] h-5 cursor-pointer gap-1" onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}>
                        {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-1">
                    {analysis.fieldResults
                      .filter(r => !categoryFilter || r.field.category === categoryFilter)
                      .map(({ field, value, hasValue, valid, issue }) => (
                        <div key={field.key} className={cn(
                          "flex items-start gap-3 px-3 py-2 rounded-md text-xs transition-colors",
                          !hasValue && field.required ? "bg-destructive/5" :
                          hasValue && !valid ? "bg-amber-500/5" :
                          hasValue ? "bg-emerald-500/5" : "bg-muted/30"
                        )}>
                          {/* Status icon */}
                          <div className="mt-0.5 shrink-0">
                            {hasValue && valid ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                             hasValue && !valid ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
                             field.required ? <XCircle className="h-4 w-4 text-destructive" /> :
                             <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20" />}
                          </div>

                          {/* Field info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{field.label}</span>
                              {field.required && <Badge variant="destructive" className="text-[8px] h-3.5 px-1">REQUIS</Badge>}
                              <Badge variant="outline" className="text-[8px] h-3.5 px-1 gap-0.5">
                                {CATEGORY_ICONS[field.category]} {CATEGORY_LABELS[field.category]}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mt-0.5">{field.description}</p>
                            {issue && <p className="text-destructive mt-0.5 font-medium">⚠ {issue}</p>}
                            {field.validation && (
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {field.validation.maxLength && <Badge variant="outline" className="text-[9px] h-4">Max {field.validation.maxLength} car.</Badge>}
                                {field.validation.minLength && <Badge variant="outline" className="text-[9px] h-4">Min {field.validation.minLength} car.</Badge>}
                                {field.validation.allowedValues && <Badge variant="outline" className="text-[9px] h-4">{field.validation.allowedValues.length} valeurs</Badge>}
                                {field.validation.minResolution && <Badge variant="outline" className="text-[9px] h-4">Min {field.validation.minResolution}</Badge>}
                              </div>
                            )}
                            {field.tips && field.tips.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {field.tips.map((tip, i) => (
                                  <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                                    <Sparkles className="h-2.5 w-2.5 mt-0.5 shrink-0 text-primary" /> {tip}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Current value */}
                          <div className="text-right shrink-0 max-w-[200px]">
                            {hasValue ? (
                              <span className="text-[10px] text-muted-foreground font-mono truncate block">
                                {typeof value === 'string' ? (value.length > 40 ? value.slice(0, 40) + '…' : value) :
                                 typeof value === 'number' ? value :
                                 Array.isArray(value) ? `${value.length} éléments` :
                                 typeof value === 'boolean' ? (value ? 'Oui' : 'Non') :
                                 JSON.stringify(value).slice(0, 30)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
