// Re-export du nouveau composant responsive pour compatibilité
export { ResponsiveProductsTable as ProductsTable } from './ResponsiveProductsTable';

// Types exportés pour compatibilité
import { UnifiedProduct } from '@/hooks/unified';

export interface ProductsTableProps {
  products: UnifiedProduct[];
  isLoading: boolean;
  selectedProducts: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkPublish: () => void;
}
