import React from 'react';
import { cn } from '@/lib/utils';
import { getPlatformLogo, getPlatformName } from '@/utils/platformLogos';

interface PlatformLogoProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
  fallbackEmoji?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const fallbackEmojis: Record<string, string> = {
  shopify: '🛍️',
  woocommerce: '🛒',
  prestashop: '🛒',
  magento: '🛒',
  bigcommerce: '🏪',
  squarespace: '🌐',
  wix: '🌐',
  amazon: '📦',
  ebay: '🔨',
  etsy: '🎨',
  aliexpress: '🛒',
  cdiscount: '🛒',
  rakuten: '🛒',
  zalando: '👗',
  fnac: '📀',
  asos: '👗',
  'tiktok-shop': '🎵',
  facebook: '📘',
  instagram: '📷',
  tiktok: '🎵',
  google: '🔍',
  'google-ads': '📢',
  'google-shopping': '🛒',
  'meta-ads': '📢',
  linkedin: '💼',
  pinterest: '📌',
  x: '✖️',
  twitter: '🐦',
  whatsapp: '💬',
  stripe: '💳',
  paypal: '💰',
  canva: '🎨',
  klaviyo: '📧',
  zapier: '⚡',
  excel: '📊',
  'google-sheets': '📊',
  bigbuy: '📦',
};

export function PlatformLogo({
  platform,
  size = 'md',
  className,
  showFallback = true,
  fallbackEmoji,
}: PlatformLogoProps) {
  const [hasError, setHasError] = React.useState(false);
  const logoSrc = getPlatformLogo(platform);
  const platformName = getPlatformName(platform);
  const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, '-');
  
  const emoji = fallbackEmoji || fallbackEmojis[normalizedPlatform] || '🔗';

  if (!logoSrc || hasError) {
    if (showFallback) {
      return (
        <span 
          className={cn('flex items-center justify-center', sizeClasses[size], className)}
          role="img"
          aria-label={platformName}
        >
          {emoji}
        </span>
      );
    }
    return null;
  }

  return (
    <img
      src={logoSrc}
      alt={platformName}
      className={cn('object-contain', sizeClasses[size], className)}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}

export default PlatformLogo;
