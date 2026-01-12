/**
 * Unified Hooks Index
 * Export all unified hooks from a single entry point
 */

// Products
export { 
  useProductsUnified, 
  useProductUnified,
  type UnifiedProduct,
  type ProductFilters,
  type ProductStats,
  type UseProductsUnifiedOptions
} from './useProductsUnified'

// Customers
export { 
  useCustomersUnified, 
  useCustomerUnified,
  useCustomerStatsUnified,
  type UnifiedCustomer,
  type CustomerFilters,
  type CustomerStats,
  type CustomerSegments,
  type UseCustomersUnifiedOptions
} from './useCustomersUnified'

// Integrations
export { 
  useIntegrationsUnified,
  type UnifiedIntegration,
  type IntegrationTemplate,
  type SyncLog,
  type IntegrationStats,
  type UseIntegrationsUnifiedOptions
} from './useIntegrationsUnified'

// Orders
export {
  useOrdersUnified,
  type UnifiedOrder
} from './useOrdersUnified'

// Suppliers
export {
  useSuppliersUnified,
  type UnifiedSupplier
} from './useSuppliersUnified'
