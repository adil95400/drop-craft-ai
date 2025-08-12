import React, { useContext, createContext } from 'react';
import { useModals, ModalState, ModalData } from '@/hooks/useModals';

interface ModalContextType {
  modalStates: ModalState;
  modalData: ModalData;
  openModal: (modalType: keyof ModalState, data?: ModalData) => void;
  closeModal: (modalType: keyof ModalState) => void;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const modalManager = useModals();
  
  return React.createElement(
    ModalContext.Provider,
    { value: modalManager },
    children
  );
};

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalContextProvider');
  }
  return context;
};

// Helper hooks for common modal operations
export const useProductModals = () => {
  const { openModal } = useModalContext();
  
  return {
    openCreateProduct: () => openModal('createProduct'),
    openStockAdjustment: (productId: string, productName: string, currentStock: number) => 
      openModal('stockAdjustment', { productId, productName, currentStock }),
    openSEOOptimization: (productId: string, productName: string) => 
      openModal('seoOptimization', { productId, productName }),
  };
};

export const useOrderModals = () => {
  const { openModal } = useModalContext();
  
  return {
    openCreateOrder: () => openModal('createOrder'),
    openTracking: (orderId: string, orderNumber: string) => 
      openModal('tracking', { orderId, orderNumber }),
  };
};

export const useMarketingModals = () => {
  const { openModal } = useModalContext();
  
  return {
    openCreateCampaign: () => openModal('createCampaign'),
    openBlogPost: () => openModal('blogPost'),
  };
};

export const useDataModals = () => {
  const { openModal } = useModalContext();
  
  return {
    openImport: (type: string) => openModal('importData', { importType: type }),
    openExport: (type: string) => openModal('exportData', { exportType: type }),
  };
};

export const useGeneralModals = () => {
  const { openModal } = useModalContext();
  
  return {
    openSettings: (module?: string) => openModal('settings', { module }),
    openCreateCustomer: () => openModal('createCustomer'),
    openCreateIntegration: () => openModal('createIntegration'),
    openSupportTicket: () => openModal('supportTicket'),
  };
};