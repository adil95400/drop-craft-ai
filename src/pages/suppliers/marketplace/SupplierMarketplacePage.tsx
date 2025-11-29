import { Helmet } from 'react-helmet-async'
import { SupplierMarketplace } from './SupplierMarketplace'

/**
 * SupplierMarketplacePage - Wrapper avec SEO pour la marketplace fournisseurs
 */
export default function SupplierMarketplacePage() {
  return (
    <>
      <Helmet>
        <title>Marketplace Fournisseurs - ShopOpti</title>
        <meta name="description" content="Découvrez et connectez les meilleurs fournisseurs dropshipping" />
      </Helmet>
      
      <SupplierMarketplace />
    </>
  )
}
