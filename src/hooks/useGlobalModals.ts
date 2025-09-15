import { useState, useEffect } from "react";

interface GlobalModalState {
  aiAlerts: {
    open: boolean;
    alerts: string[];
  };
  carrierDetails: {
    open: boolean;
    carrier: string;
    metrics: any;
  };
}

export function useGlobalModals() {
  const [modals, setModals] = useState<GlobalModalState>({
    aiAlerts: { open: false, alerts: [] },
    carrierDetails: { open: false, carrier: "", metrics: null }
  });

  useEffect(() => {
    const handleAIAlertsModal = (event: CustomEvent) => {
      setModals(prev => ({
        ...prev,
        aiAlerts: {
          open: true,
          alerts: event.detail.alerts || []
        }
      }));
    };

    const handleCarrierDetailsModal = (event: CustomEvent) => {
      setModals(prev => ({
        ...prev,
        carrierDetails: {
          open: true,
          carrier: event.detail.carrier || "",
          metrics: event.detail.metrics || null
        }
      }));
    };

    window.addEventListener('open-ai-alerts-modal', handleAIAlertsModal as EventListener);
    window.addEventListener('open-carrier-details-modal', handleCarrierDetailsModal as EventListener);

    return () => {
      window.removeEventListener('open-ai-alerts-modal', handleAIAlertsModal as EventListener);
      window.removeEventListener('open-carrier-details-modal', handleCarrierDetailsModal as EventListener);
    };
  }, []);

  const closeAIAlerts = () => {
    setModals(prev => ({
      ...prev,
      aiAlerts: { ...prev.aiAlerts, open: false }
    }));
  };

  const closeCarrierDetails = () => {
    setModals(prev => ({
      ...prev,
      carrierDetails: { ...prev.carrierDetails, open: false }
    }));
  };

  return {
    modals,
    closeAIAlerts,
    closeCarrierDetails
  };
}