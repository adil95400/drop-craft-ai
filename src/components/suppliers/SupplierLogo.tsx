/**
 * SupplierLogo Component
 * Displays supplier logos with fallback to styled placeholder
 */

import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SupplierLogoProps {
  name: string
  logo?: string
  country?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

// Generate a consistent color from string
const stringToColor = (str: string): { bg: string; text: string } => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return {
    bg: `hsl(${hue}, 65%, 55%)`,
    text: 'white',
  }
}

// Get initials from supplier name
const getInitials = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/[\s-]+/)
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || name.slice(0, 2).toUpperCase()
}

// Country flag emojis
const countryFlags: Record<string, string> = {
  CN: '🇨🇳',
  US: '🇺🇸',
  FR: '🇫🇷',
  DE: '🇩🇪',
  UK: '🇬🇧',
  GB: '🇬🇧',
  IT: '🇮🇹',
  ES: '🇪🇸',
  NL: '🇳🇱',
  PL: '🇵🇱',
  LT: '🇱🇹',
  LV: '🇱🇻',
  EE: '🇪🇪',
  RO: '🇷🇴',
  CZ: '🇨🇿',
  HU: '🇭🇺',
  GR: '🇬🇷',
  FI: '🇫🇮',
  SE: '🇸🇪',
  EU: '🇪🇺',
  AU: '🇦🇺',
  CA: '🇨🇦',
  NZ: '🇳🇿',
  IN: '🇮🇳',
  JP: '🇯🇵',
  KR: '🇰🇷',
  TR: '🇹🇷',
  BR: '🇧🇷',
  MX: '🇲🇽',
  SG: '🇸🇬',
  ID: '🇮🇩',
  BE: '🇧🇪',
  AT: '🇦🇹',
  PT: '🇵🇹',
  DK: '🇩🇰',
  NO: '🇳🇴',
  CH: '🇨🇭',
  IE: '🇮🇪',
}

// Known supplier logos (high quality local SVGs and CDN)
const knownLogos: Record<string, string> = {
  // Local SVGs
  aliexpress: '/logos/aliexpress.svg',
  amazon: '/logos/amazon.svg',
  ebay: '/logos/ebay.svg',
  etsy: '/logos/etsy.svg',
  cdiscount: '/logos/cdiscount.svg',
  rakuten: '/logos/rakuten.svg',
  zalando: '/logos/zalando.svg',
  fnac: '/logos/fnac.svg',
  asos: '/logos/asos.svg',
  bigbuy: '/logos/bigbuy.svg',
  shopify: '/logos/shopify.svg',
  woocommerce: '/logos/woocommerce.svg',
  prestashop: '/logos/prestashop.svg',
  magento: '/logos/magento.svg',
  bigcommerce: '/logos/bigcommerce.svg',
  squarespace: '/logos/squarespace.svg',
  wix: '/logos/wix.svg',
  stripe: '/logos/stripe.svg',
  paypal: '/logos/paypal.svg',
  facebook: '/logos/facebook.svg',
  instagram: '/logos/instagram-color.svg',
  tiktok: '/logos/tiktok.svg',
  google: '/logos/google.svg',
  pinterest: '/logos/pinterest.svg',
  canva: '/logos/canva.svg',
  klaviyo: '/logos/klaviyo.svg',
  zapier: '/logos/zapier.svg',
  costco: '/logos/costco.svg',
  
  // CDN/External logos for dropshipping suppliers
  cjdropshipping: 'https://www.cjdropshipping.com/static/img/logo.svg',
  spocket: 'https://cdn.shopify.com/s/files/1/0070/7032/files/spocket-logo.png',
  dsers: 'https://www.dsers.com/wp-content/uploads/2021/09/dsers-logo.svg',
  syncee: 'https://syncee.com/static/images/syncee-logo.svg',
  zendrop: 'https://zendrop.com/wp-content/uploads/2023/01/zendrop-logo.svg',
  printful: 'https://www.printful.com/static/images/layout/printful-logo.svg',
  printify: 'https://printify.com/assets/images/logo.svg',
  temu: 'https://www.temu.com/favicon.ico',
  alibaba: 'https://www.alibaba.com/favicon.ico',
  vidaxl: 'https://www.vidaxl.com/favicon.ico',
  oberlo: 'https://cdn.shopify.com/s/files/1/0070/7032/files/oberlo-logo.png',
  modalyst: 'https://modalyst.co/wp-content/uploads/2021/08/modalyst-logo.svg',
  gooten: 'https://www.gooten.com/wp-content/themes/gooten/assets/images/logo.svg',
  spreadshirt: 'https://www.spreadshirt.com/image/logo.svg',
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const imageSizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

export function SupplierLogo({ 
  name, 
  logo, 
  country, 
  size = 'md',
  className 
}: SupplierLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // Normalize the name for lookup
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  
  // Get the best logo URL
  const logoUrl = useMemo(() => {
    if (knownLogos[normalizedName]) {
      return knownLogos[normalizedName]
    }
    if (logo && !logo.includes('favicon.ico')) {
      return logo
    }
    return null
  }, [normalizedName, logo])
  
  // Placeholder data
  const placeholder = useMemo(() => ({
    initials: getInitials(name),
    ...stringToColor(name),
    flag: country ? countryFlags[country] || '' : '',
  }), [name, country])
  
  // Should we show the image or placeholder?
  const showImage = logoUrl && !imageError
  
  return (
    <div 
      className={cn(
        'relative rounded-lg overflow-hidden flex items-center justify-center shrink-0',
        sizeClasses[size],
        className
      )}
      style={!showImage || !imageLoaded ? { 
        backgroundColor: placeholder.bg,
        color: placeholder.text,
      } : undefined}
    >
      {showImage && (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          width={imageSizes[size]}
          height={imageSizes[size]}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          className={cn(
            'w-full h-full object-contain p-1 bg-white rounded-lg',
            !imageLoaded && 'opacity-0 absolute'
          )}
        />
      )}
      
      {(!showImage || !imageLoaded) && (
        <span className="font-bold select-none">
          {placeholder.initials}
        </span>
      )}
      
      {/* Country flag badge */}
      {placeholder.flag && size !== 'sm' && (
        <span 
          className={cn(
            'absolute -bottom-0.5 -right-0.5 text-xs leading-none',
            size === 'xl' && 'text-sm'
          )}
        >
          {placeholder.flag}
        </span>
      )}
    </div>
  )
}

export default SupplierLogo
