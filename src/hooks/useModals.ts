import { useState } from 'react';

export interface ModalState {
  createProduct: boolean;
  createOrder: boolean;
  createCustomer: boolean;
  createIntegration: boolean;
  importData: boolean;
  exportData: boolean;
  settings: boolean;
  createCampaign: boolean;
  stockAdjustment: boolean;
  tracking: boolean;
  seoOptimization: boolean;
  blogPost: boolean;
  supportTicket: boolean;
  newAutomation: boolean;
  configAutomation: boolean;
  notification: boolean;
  generateReport: boolean;
  createSupplier: boolean;
  supplierFeed: boolean;
  aiInsights: boolean;
  bulkActions: boolean;
  productDetails: boolean;
}

export interface ModalData {
  productId?: string;
  productName?: string;
  currentStock?: number;
  orderId?: string;
  orderNumber?: string;
  automationId?: string;
  selectedItems?: any[];
  [key: string]: any;
}

export const useModals = () => {
  const [modalStates, setModalStates] = useState<ModalState>({
    createProduct: false,
    createOrder: false,
    createCustomer: false,
    createIntegration: false,
    importData: false,
    exportData: false,
    settings: false,
    createCampaign: false,
    stockAdjustment: false,
    tracking: false,
    seoOptimization: false,
    blogPost: false,
    supportTicket: false,
    newAutomation: false,
    configAutomation: false,
    notification: false,
    generateReport: false,
    createSupplier: false,
    supplierFeed: false,
    aiInsights: false,
    bulkActions: false,
    productDetails: false,
  });

  const [modalData, setModalData] = useState<ModalData>({});

  const openModal = (modalType: keyof ModalState, data?: ModalData) => {
    setModalStates(prev => ({ ...prev, [modalType]: true }));
    if (data) {
      setModalData(data);
    }
  };

  const closeModal = (modalType: keyof ModalState) => {
    setModalStates(prev => ({ ...prev, [modalType]: false }));
    setModalData({});
  };

  const closeAllModals = () => {
    setModalStates({
      createProduct: false,
      createOrder: false,
      createCustomer: false,
      createIntegration: false,
      importData: false,
      exportData: false,
      settings: false,
      createCampaign: false,
      stockAdjustment: false,
      tracking: false,
      seoOptimization: false,
      blogPost: false,
      supportTicket: false,
      newAutomation: false,
      configAutomation: false,
      notification: false,
      generateReport: false,
      createSupplier: false,
      supplierFeed: false,
      aiInsights: false,
      bulkActions: false,
      productDetails: false,
    });
    setModalData({});
  };

  return {
    modalStates,
    modalData,
    openModal,
    closeModal,
    closeAllModals,
  };
};