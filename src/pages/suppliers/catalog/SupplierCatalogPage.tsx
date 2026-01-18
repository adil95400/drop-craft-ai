import { useParams, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { EnhancedUnifiedCatalog } from './EnhancedUnifiedCatalog'

/**
 * SupplierCatalogPage - Affiche le catalogue d'un fournisseur spécifique
 * Redirige vers le catalogue unifié avec le filtre fournisseur
 */
export default function SupplierCatalogPage() {
  const { id } = useParams()
  const [, setSearchParams] = useSearchParams()
  
  useEffect(() => {
    if (id) {
      setSearchParams({ supplier: id }, { replace: true })
    }
  }, [id, setSearchParams])
  
  return <EnhancedUnifiedCatalog />
}
