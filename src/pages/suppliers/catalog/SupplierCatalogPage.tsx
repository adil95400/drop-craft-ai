import { useParams } from 'react-router-dom'
import { EnhancedUnifiedCatalog } from './EnhancedUnifiedCatalog'

/**
 * SupplierCatalogPage - Affiche le catalogue d'un fournisseur spécifique
 * Utilise le nouveau catalogue unifié amélioré avec filtrage par fournisseur
 */
export default function SupplierCatalogPage() {
  const { id } = useParams()
  return <EnhancedUnifiedCatalog supplierId={id} />
}
