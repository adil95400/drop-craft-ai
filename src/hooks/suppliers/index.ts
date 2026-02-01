/**
 * Supplier Hooks - Unified exports
 */

export { useB2BSupplierConnector, B2B_SUPPLIERS } from './useB2BSupplierConnector';
export type {
  SupplierCredentials,
  SupplierConnection,
  SupplierProduct,
  SupplierVariant,
  SupplierReliabilityScore,
  SupplierSearchParams,
  SupplierComparisonResult,
  B2BSupplierId,
} from './useB2BSupplierConnector';

export { useSupplierReliability } from './useSupplierReliability';
export type {
  ReliabilityMetrics,
  SupplierComparison,
} from './useSupplierReliability';
