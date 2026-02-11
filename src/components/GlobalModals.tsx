import { useGlobalModals } from "@/hooks/useGlobalModals";
import { AIAlertsModal } from "@/components/modals/AIAlertsModal";
import { CarrierDetailsModal } from "@/components/modals/CarrierDetailsModal";
import { WelcomeOnboardingModal } from "@/components/onboarding/WelcomeOnboardingModal";
import { FloatingChatWidget } from "@/components/support/FloatingChatWidget";

export function GlobalModals() {
  const { modals, closeAIAlerts, closeCarrierDetails } = useGlobalModals();

  return (
    <>
      <AIAlertsModal
        open={modals.aiAlerts.open}
        onOpenChange={closeAIAlerts}
        alerts={modals.aiAlerts.alerts}
      />
      
      <CarrierDetailsModal
        open={modals.carrierDetails.open}
        onOpenChange={closeCarrierDetails}
        carrier={modals.carrierDetails.carrier}
        metrics={modals.carrierDetails.metrics}
      />

      <WelcomeOnboardingModal />
      <FloatingChatWidget />
    </>
  );
}