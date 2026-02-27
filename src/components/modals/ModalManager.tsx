import { lazy, Suspense } from 'react';
import { useModalContext } from '@/hooks/useModalHelpers';

// Lazy load all modals for better performance
const CreateProductDialog = lazy(() => import('../products/CreateProductDialog').then(m => ({ default: m.CreateProductDialog })));
const CreateOrderDialog = lazy(() => import('./CreateOrderDialog').then(m => ({ default: m.CreateOrderDialog })));
const CreateCustomerDialog = lazy(() => import('./CreateCustomerDialog').then(m => ({ default: m.CreateCustomerDialog })));
const CreateIntegrationDialog = lazy(() => import('./CreateIntegrationDialog').then(m => ({ default: m.CreateIntegrationDialog })));
const ImportDataDialog = lazy(() => import('./ImportDataDialog').then(m => ({ default: m.ImportDataDialog })));
const ExportDataDialog = lazy(() => import('./ExportDataDialog').then(m => ({ default: m.ExportDataDialog })));
const SettingsDialog = lazy(() => import('./SettingsDialog').then(m => ({ default: m.SettingsDialog })));
const CreateCampaignDialog = lazy(() => import('./CreateCampaignDialog').then(m => ({ default: m.CreateCampaignDialog })));
const StockAdjustmentDialog = lazy(() => import('./StockAdjustmentDialog').then(m => ({ default: m.StockAdjustmentDialog })));
const TrackingDialog = lazy(() => import('./TrackingDialog').then(m => ({ default: m.TrackingDialog })));
const SEOOptimizationDialog = lazy(() => import('./SEOOptimizationDialog').then(m => ({ default: m.SEOOptimizationDialog })));
const BlogPostDialog = lazy(() => import('./BlogPostDialog').then(m => ({ default: m.BlogPostDialog })));
const SupportTicketDialog = lazy(() => import('./SupportTicketDialog').then(m => ({ default: m.SupportTicketDialog })));
const BulkActionsDialog = lazy(() => import('./BulkActionsDialog').then(m => ({ default: m.BulkActionsDialog })));
const NotificationDialog = lazy(() => import('./NotificationDialog').then(m => ({ default: m.NotificationDialog })));
const GenerateReportDialog = lazy(() => import('./GenerateReportDialog').then(m => ({ default: m.GenerateReportDialog })));
const CreateSupplierDialog = lazy(() => import('./CreateSupplierDialog').then(m => ({ default: m.CreateSupplierDialog })));
const SupplierFeedDialog = lazy(() => import('./SupplierFeedDialog').then(m => ({ default: m.SupplierFeedDialog })));
const NewAutomationDialog = lazy(() => import('./NewAutomationDialog').then(m => ({ default: m.NewAutomationDialog })));
const ConfigAutomationDialog = lazy(() => import('./ConfigAutomationDialog').then(m => ({ default: m.ConfigAutomationDialog })));
const AIInsightsDialog = lazy(() => import('./AIInsightsDialog').then(m => ({ default: m.AIInsightsDialog })));
const ProductDetailsDialog = lazy(() => import('./ProductDetailsDialog').then(m => ({ default: m.ProductDetailsDialog })));

/** Renders a lazy modal only when it's open */
function LazyModal({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  if (!isOpen) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
}

export function ModalManager() {
  const { modalStates, modalData, closeModal } = useModalContext();

  return (
    <>
      <LazyModal isOpen={modalStates.createProduct}>
        <CreateProductDialog
          open={modalStates.createProduct}
          onOpenChange={(open) => !open && closeModal('createProduct')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.createOrder}>
        <CreateOrderDialog
          open={modalStates.createOrder}
          onOpenChange={(open) => !open && closeModal('createOrder')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.createCustomer}>
        <CreateCustomerDialog
          open={modalStates.createCustomer}
          onOpenChange={(open) => !open && closeModal('createCustomer')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.createIntegration}>
        <CreateIntegrationDialog
          open={modalStates.createIntegration}
          onOpenChange={(open) => !open && closeModal('createIntegration')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.importData}>
        <ImportDataDialog
          open={modalStates.importData}
          onOpenChange={(open) => !open && closeModal('importData')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.exportData}>
        <ExportDataDialog
          open={modalStates.exportData}
          onOpenChange={(open) => !open && closeModal('exportData')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.settings}>
        <SettingsDialog
          open={modalStates.settings}
          onOpenChange={(open) => !open && closeModal('settings')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.createCampaign}>
        <CreateCampaignDialog
          open={modalStates.createCampaign}
          onOpenChange={(open) => !open && closeModal('createCampaign')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.stockAdjustment}>
        <StockAdjustmentDialog
          open={modalStates.stockAdjustment}
          onOpenChange={(open) => !open && closeModal('stockAdjustment')}
          productId={modalData.productId}
          productName={modalData.productName}
          currentStock={modalData.currentStock}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.tracking}>
        <TrackingDialog
          open={modalStates.tracking}
          onOpenChange={(open) => !open && closeModal('tracking')}
          orderId={modalData.orderId}
          orderNumber={modalData.orderNumber}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.seoOptimization}>
        <SEOOptimizationDialog
          open={modalStates.seoOptimization}
          onOpenChange={(open) => !open && closeModal('seoOptimization')}
          productId={modalData.productId}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.blogPost}>
        <BlogPostDialog
          open={modalStates.blogPost}
          onOpenChange={(open) => !open && closeModal('blogPost')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.supportTicket}>
        <SupportTicketDialog
          open={modalStates.supportTicket}
          onOpenChange={(open) => !open && closeModal('supportTicket')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.bulkActions}>
        <BulkActionsDialog
          open={modalStates.bulkActions}
          onOpenChange={(open) => !open && closeModal('bulkActions')}
          selectedItems={modalData.selectedItems || []}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.notification}>
        <NotificationDialog
          open={modalStates.notification}
          onOpenChange={(open) => !open && closeModal('notification')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.generateReport}>
        <GenerateReportDialog
          open={modalStates.generateReport}
          onOpenChange={(open) => !open && closeModal('generateReport')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.createSupplier}>
        <CreateSupplierDialog
          open={modalStates.createSupplier}
          onOpenChange={(open) => !open && closeModal('createSupplier')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.supplierFeed}>
        <SupplierFeedDialog
          open={modalStates.supplierFeed}
          onOpenChange={(open) => !open && closeModal('supplierFeed')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.newAutomation}>
        <NewAutomationDialog
          open={modalStates.newAutomation}
          onOpenChange={(open) => !open && closeModal('newAutomation')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.configAutomation}>
        <ConfigAutomationDialog
          open={modalStates.configAutomation}
          onOpenChange={(open) => !open && closeModal('configAutomation')}
          automationId={modalData.automationId}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.aiInsights}>
        <AIInsightsDialog
          open={modalStates.aiInsights}
          onOpenChange={(open) => !open && closeModal('aiInsights')}
        />
      </LazyModal>

      <LazyModal isOpen={modalStates.productDetails}>
        <ProductDetailsDialog
          open={modalStates.productDetails}
          onOpenChange={(open) => !open && closeModal('productDetails')}
          productId={modalData.productId}
        />
      </LazyModal>
    </>
  );
}
