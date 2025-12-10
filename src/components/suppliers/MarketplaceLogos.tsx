// LOGOS OFFICIELS DES MARKETPLACES ET FOURNISSEURS
// SVG inline pour éviter les 404 et garantir un affichage parfait

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14'
};

// AliExpress Logo
export const AliExpressLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-[#E62E04]", className)}>
    <svg viewBox="0 0 24 24" className="h-2/3 w-2/3 text-white" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  </div>
));
AliExpressLogo.displayName = 'AliExpressLogo';

// Amazon Logo
export const AmazonLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-[#232F3E]", className)}>
    <svg viewBox="0 0 24 24" className="h-2/3 w-2/3" fill="none">
      <path d="M14.5 17.5C10.2 20.5 3.5 21 1 18c3.5 2 9.5 2.5 13.5 0z" fill="#FF9900"/>
      <path d="M15.5 16.5c.5-.5 1.5-1 2.5-.5-.5.5-2 2-2.5 1-.5-.5-.5-.5 0-.5z" fill="#FF9900"/>
      <text x="3" y="14" fill="white" fontSize="8" fontWeight="bold">a</text>
    </svg>
  </div>
));
AmazonLogo.displayName = 'AmazonLogo';

// eBay Logo
export const EbayLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-white border border-border", className)}>
    <svg viewBox="0 0 48 20" className="h-1/2 w-3/4">
      <text x="0" y="16" fontSize="14" fontWeight="bold">
        <tspan fill="#E53238">e</tspan>
        <tspan fill="#0064D2">b</tspan>
        <tspan fill="#F5AF02">a</tspan>
        <tspan fill="#86B817">y</tspan>
      </text>
    </svg>
  </div>
));
EbayLogo.displayName = 'EbayLogo';

// Shopify Logo
export const ShopifyLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-[#96BF48]", className)}>
    <svg viewBox="0 0 24 24" className="h-2/3 w-2/3 text-white" fill="currentColor">
      <path d="M15.337 3.415c-.058-.019-.127-.009-.195.03-.01.006-.107.078-.217.167-.143-.433-.395-.833-.82-1.05-.055-.028-.11-.05-.163-.07v-.013c-.22-.642-.643-1.037-1.09-1.023-.63.017-1.138.773-1.427 1.9-.366.052-.735.108-1.103.169L10 3.597c-.026-.083-.089-.145-.163-.168-.517-.164-1.136-.003-1.736.452-.823.627-1.513 1.628-1.943 2.82-.611 1.7-.528 3.346.14 4.407l-.006.003 3.23 9.932c.047.147.18.25.338.256.013 0 .025.002.037.002.147 0 .288-.08.36-.22l1.27-2.466c.073.02.147.04.22.058l.924 2.842c.048.147.18.25.338.256.013 0 .025.002.038.002.147 0 .288-.08.36-.22l4.93-9.55c.602-1.168.67-2.502.186-3.66-.367-.88-1.022-1.552-1.84-1.892-.06-.025-.12-.048-.18-.07l.107-.332c.03-.09.008-.187-.05-.263zm-3.85-.47c.113-.478.26-.872.432-1.157.103-.17.213-.3.32-.38.063-.045.116-.064.147-.064.005.003.012.01.018.018.01.012.022.03.033.053.178.355.212.908.093 1.567-.198.03-.398.06-.6.092-.145-.028-.29-.058-.442-.087v-.04zm-1.168.23c.336.063.673.13 1.01.2-.153.66-.387 1.46-.656 2.267-.42-.187-.758-.503-.962-.89-.216-.413-.283-.898-.2-1.396.263-.062.536-.121.808-.18zM8.1 6.36c.287-.803.712-1.453 1.216-1.837.348-.265.698-.38.985-.324.065.012.12.036.165.07.282.218.406.662.346 1.258-.068.698-.335 1.5-.75 2.26-.18.33-.377.618-.58.862-.13-.27-.223-.566-.274-.876-.124-.76-.008-1.563.3-2.34z"/>
    </svg>
  </div>
));
ShopifyLogo.displayName = 'ShopifyLogo';

// BigBuy Logo
export const BigBuyLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-[#00A3E0]", className)}>
    <span className="text-white font-bold text-xs">BB</span>
  </div>
));
BigBuyLogo.displayName = 'BigBuyLogo';

// Temu Logo
export const TemuLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-[#FF6B00]", className)}>
    <span className="text-white font-bold text-xs">Temu</span>
  </div>
));
TemuLogo.displayName = 'TemuLogo';

// CDiscount Logo
export const CdiscountLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-[#C21A00]", className)}>
    <span className="text-white font-bold text-xs">Cd</span>
  </div>
));
CdiscountLogo.displayName = 'CdiscountLogo';

// Etsy Logo
export const EtsyLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-[#F56400]", className)}>
    <span className="text-white font-bold text-sm">Etsy</span>
  </div>
));
EtsyLogo.displayName = 'EtsyLogo';

// WooCommerce Logo
export const WooCommerceLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-[#96588A]", className)}>
    <span className="text-white font-bold text-xs">Woo</span>
  </div>
));
WooCommerceLogo.displayName = 'WooCommerceLogo';

// CJ Dropshipping Logo
export const CJDropshippingLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600", className)}>
    <span className="text-white font-bold text-xs">CJ</span>
  </div>
));
CJDropshippingLogo.displayName = 'CJDropshippingLogo';

// Printful Logo
export const PrintfulLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-[#1B365D]", className)}>
    <span className="text-white font-bold text-xs">PF</span>
  </div>
));
PrintfulLogo.displayName = 'PrintfulLogo';

// Google Shopping Logo
export const GoogleShoppingLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-white border border-border", className)}>
    <svg viewBox="0 0 24 24" className="h-2/3 w-2/3">
      <circle cx="8" cy="8" r="3" fill="#4285F4"/>
      <circle cx="16" cy="8" r="3" fill="#EA4335"/>
      <circle cx="8" cy="16" r="3" fill="#34A853"/>
      <circle cx="16" cy="16" r="3" fill="#FBBC05"/>
    </svg>
  </div>
));
GoogleShoppingLogo.displayName = 'GoogleShoppingLogo';

// TikTok Shop Logo
export const TikTokShopLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-black", className)}>
    <svg viewBox="0 0 24 24" className="h-2/3 w-2/3" fill="none">
      <path d="M9 12a4 4 0 1 0 8 0" stroke="#25F4EE" strokeWidth="2"/>
      <path d="M12 3v13M12 8c2-2 4-2 6-1" stroke="#FE2C55" strokeWidth="2"/>
      <path d="M12 3v13M12 8c2-2 4-2 6-1" stroke="white" strokeWidth="2" strokeOpacity="0.8"/>
    </svg>
  </div>
));
TikTokShopLogo.displayName = 'TikTokShopLogo';

// Spocket Logo
export const SpocketLogo = memo(({ className, size = 'md' }: LogoProps) => (
  <div className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg bg-[#0066FF]", className)}>
    <span className="text-white font-bold text-xs">Sp</span>
  </div>
));
SpocketLogo.displayName = 'SpocketLogo';

// Generic Marketplace Logo
export const GenericMarketplaceLogo = memo(({ className, size = 'md', name }: LogoProps & { name: string }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  
  return (
    <div 
      className={cn(sizeClasses[size], "flex items-center justify-center rounded-lg", className)}
      style={{ backgroundColor: colors[colorIndex] }}
    >
      <span className="text-white font-bold text-xs">{initials}</span>
    </div>
  );
});
GenericMarketplaceLogo.displayName = 'GenericMarketplaceLogo';

// Logo Resolver - retourne le bon logo selon l'ID
export const getMarketplaceLogo = (id: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const logoMap: Record<string, React.FC<LogoProps>> = {
    'aliexpress': AliExpressLogo,
    'amazon': AmazonLogo,
    'ebay': EbayLogo,
    'shopify': ShopifyLogo,
    'bigbuy': BigBuyLogo,
    'temu': TemuLogo,
    'cdiscount': CdiscountLogo,
    'etsy': EtsyLogo,
    'woocommerce': WooCommerceLogo,
    'cjdropshipping': CJDropshippingLogo,
    'printful': PrintfulLogo,
    'google-shopping': GoogleShoppingLogo,
    'tiktok-shop': TikTokShopLogo,
    'spocket': SpocketLogo,
  };

  const LogoComponent = logoMap[id.toLowerCase()];
  if (LogoComponent) {
    return <LogoComponent size={size} />;
  }
  
  return <GenericMarketplaceLogo name={id} size={size} />;
};
