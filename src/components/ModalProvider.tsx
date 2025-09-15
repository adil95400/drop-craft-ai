import React from 'react';
import { useModals } from '@/hooks/useModals';
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
  SupportTicketDialog
} from '@/components/modals';
import { NewAutomationDialog } from '@/components/automation/NewAutomationDialog';
import { AutomationConfigDialog } from '@/components/automation/AutomationConfigDialog';
import { AIInsightsModal } from '@/components/dashboard/AIInsightsModal';

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const { modalStates, modalData, closeModal } = useModals();

  return (
    <>
      {children}
      
      {/* Product Modals */}
      <CreateProductDialog
        open={modalStates.createProduct}
        onOpenChange={(open) => !open && closeModal('createProduct')}
      />
      
      {/* Order Modals */}
      <CreateOrderDialog
        open={modalStates.createOrder}
        onOpenChange={(open) => !open && closeModal('createOrder')}
      />
      
      {/* Customer Modals */}
      <CreateCustomerDialog
        open={modalStates.createCustomer}
        onOpenChange={(open) => !open && closeModal('createCustomer')}
      />
      
      {/* Integration Modals */}
      <CreateIntegrationDialog
        open={modalStates.createIntegration}
        onOpenChange={(open) => !open && closeModal('createIntegration')}
      />
      
      {/* Data Management Modals */}
      <ImportDataDialog
        open={modalStates.importData}
        onOpenChange={(open) => !open && closeModal('importData')}
      />
      
      <ExportDataDialog
        open={modalStates.exportData}
        onOpenChange={(open) => !open && closeModal('exportData')}
      />
      
      {/* Settings Modal */}
      <SettingsDialog
        open={modalStates.settings}
        onOpenChange={(open) => !open && closeModal('settings')}
      />
      
      {/* Marketing Modals */}
      <CreateCampaignDialog
        open={modalStates.createCampaign}
        onOpenChange={(open) => !open && closeModal('createCampaign')}
      />
      
      {/* Inventory Modals */}
      <StockAdjustmentDialog
        open={modalStates.stockAdjustment}
        onOpenChange={(open) => !open && closeModal('stockAdjustment')}
        productId={modalData.productId}
        productName={modalData.productName}
        currentStock={modalData.currentStock}
      />
      
      {/* Tracking Modal */}
      <TrackingDialog
        open={modalStates.tracking}
        onOpenChange={(open) => !open && closeModal('tracking')}
        orderId={modalData.orderId}
        orderNumber={modalData.orderNumber}
      />
      
      {/* SEO Modal */}
      <SEOOptimizationDialog
        open={modalStates.seoOptimization}
        onOpenChange={(open) => !open && closeModal('seoOptimization')}
        productId={modalData.productId}
        productName={modalData.productName}
      />
      
      {/* Blog Modal */}
      <BlogPostDialog
        open={modalStates.blogPost}
        onOpenChange={(open) => !open && closeModal('blogPost')}
      />
      
      {/* Support Modal */}
      <SupportTicketDialog
        open={modalStates.supportTicket}
        onOpenChange={(open) => !open && closeModal('supportTicket')}
      />
      
      {/* Automation Modals */}
      <NewAutomationDialog
        open={modalStates.newAutomation}
        onOpenChange={(open) => !open && closeModal('newAutomation')}
      />
      
      {modalData.selectedAutomation && (
        <AutomationConfigDialog
          open={modalStates.configAutomation}
          onOpenChange={(open) => !open && closeModal('configAutomation')}
          automation={modalData.selectedAutomation}
        />
      )}
      
      {/* AI Insights Modal */}
      <AIInsightsModal
        open={modalStates.aiInsights}
        onOpenChange={(open) => !open && closeModal('aiInsights')}
      />
    </>
  );
};