import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { UnifiedCatalog } from './UnifiedCatalog'

/**
 * SupplierCatalogPage - Affiche le catalogue d'un fournisseur spécifique
 * Wrapper autour de UnifiedCatalog avec filtrage par fournisseur
 */
export default function SupplierCatalogPage() {
  const { id } = useParams()

  return (
    <>
      <Helmet>
        <title>Catalogue Fournisseur - ShopOpti</title>
        <meta name="description" content="Parcourez le catalogue de ce fournisseur" />
      </Helmet>
      
      <UnifiedCatalog supplierId={id} />
    </>
  )
}
