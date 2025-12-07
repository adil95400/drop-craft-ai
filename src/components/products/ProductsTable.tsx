// Re-export du nouveau composant responsive pour compatibilité
export { ResponsiveProductsTable as ProductsTable } from './ResponsiveProductsTable';

// Types exportés pour compatibilité
import { Product } from '@/hooks/useRealProducts';

export interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  selectedProducts: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkPublish: () => void;
}
