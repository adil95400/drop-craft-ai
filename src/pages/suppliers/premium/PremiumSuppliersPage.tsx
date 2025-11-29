import { Helmet } from 'react-helmet-async'
import { SupplierMarketplace } from '../marketplace/SupplierMarketplace'

/**
 * PremiumSuppliersPage - Wrapper pour afficher uniquement les fournisseurs premium
 * Réutilise le composant SupplierMarketplace avec un préfiltre
 */
export default function PremiumSuppliersPage() {
  return (
    <>
      <Helmet>
        <title>Fournisseurs Premium - ShopOpti</title>
        <meta name="description" content="Découvrez nos fournisseurs premium avec des produits de haute qualité" />
      </Helmet>
      
      <SupplierMarketplace isPremiumOnly={true} />
    </>
  )
}
