import { useModalContext } from '@/hooks/useModalHelpers';
import {
  CreateProductDialog,
  CreateOrderDialog,
  CreateCustomerDialog,
  CreateIntegrationDialog,
  ImportDataDialog,
  ExportDataDialog,
  SettingsDialog,
  CreateCampaignDialog,
  StockAdjustmentDialog,
  TrackingDialog,
  SEOOptimizationDialog,
  BlogPostDialog,
  SupportTicketDialog,
  BulkActionsDialog,
  NotificationDialog,
  GenerateReportDialog,
  CreateSupplierDialog,
  SupplierFeedDialog,
  NewAutomationDialog,
  ConfigAutomationDialog,
  AIInsightsDialog,
  ProductDetailsDialog,
} from './index';

export function ModalManager() {
  const { modalStates, modalData, closeModal } = useModalContext();

  return (
    <>
      <CreateProductDialog
        open={modalStates.createProduct}
        onOpenChange={(open) => !open && closeModal('createProduct')}
      />

      <CreateOrderDialog
        open={modalStates.createOrder}
        onOpenChange={(open) => !open && closeModal('createOrder')}
      />

      <CreateCustomerDialog
        open={modalStates.createCustomer}
        onOpenChange={(open) => !open && closeModal('createCustomer')}
      />

      <CreateIntegrationDialog
        open={modalStates.createIntegration}
        onOpenChange={(open) => !open && closeModal('createIntegration')}
      />

      <ImportDataDialog
        open={modalStates.importData}
        onOpenChange={(open) => !open && closeModal('importData')}
      />

      <ExportDataDialog
        open={modalStates.exportData}
        onOpenChange={(open) => !open && closeModal('exportData')}
      />

      <SettingsDialog
        open={modalStates.settings}
        onOpenChange={(open) => !open && closeModal('settings')}
      />

      <CreateCampaignDialog
        open={modalStates.createCampaign}
        onOpenChange={(open) => !open && closeModal('createCampaign')}
      />

      <StockAdjustmentDialog
        open={modalStates.stockAdjustment}
        onOpenChange={(open) => !open && closeModal('stockAdjustment')}
        productId={modalData.productId}
        productName={modalData.productName}
        currentStock={modalData.currentStock}
      />

      <TrackingDialog
        open={modalStates.tracking}
        onOpenChange={(open) => !open && closeModal('tracking')}
        orderId={modalData.orderId}
        orderNumber={modalData.orderNumber}
      />

      <SEOOptimizationDialog
        open={modalStates.seoOptimization}
        onOpenChange={(open) => !open && closeModal('seoOptimization')}
        productId={modalData.productId}
      />

      <BlogPostDialog
        open={modalStates.blogPost}
        onOpenChange={(open) => !open && closeModal('blogPost')}
      />

      <SupportTicketDialog
        open={modalStates.supportTicket}
        onOpenChange={(open) => !open && closeModal('supportTicket')}
      />

      <BulkActionsDialog
        open={modalStates.bulkActions}
        onOpenChange={(open) => !open && closeModal('bulkActions')}
        selectedItems={modalData.selectedItems || []}
      />

      <NotificationDialog
        open={modalStates.notification}
        onOpenChange={(open) => !open && closeModal('notification')}
      />

      <GenerateReportDialog
        open={modalStates.generateReport}
        onOpenChange={(open) => !open && closeModal('generateReport')}
      />

      <CreateSupplierDialog
        open={modalStates.createSupplier}
        onOpenChange={(open) => !open && closeModal('createSupplier')}
      />

      <SupplierFeedDialog
        open={modalStates.supplierFeed}
        onOpenChange={(open) => !open && closeModal('supplierFeed')}
      />

      <NewAutomationDialog
        open={modalStates.newAutomation}
        onOpenChange={(open) => !open && closeModal('newAutomation')}
      />

      <ConfigAutomationDialog
        open={modalStates.configAutomation}
        onOpenChange={(open) => !open && closeModal('configAutomation')}
        automationId={modalData.automationId}
      />

      <AIInsightsDialog
        open={modalStates.aiInsights}
        onOpenChange={(open) => !open && closeModal('aiInsights')}
      />

      <ProductDetailsDialog
        open={modalStates.productDetails}
        onOpenChange={(open) => !open && closeModal('productDetails')}
        productId={modalData.productId}
      />
    </>
  );
}
