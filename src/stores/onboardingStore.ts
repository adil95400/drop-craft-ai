/**
 * Sprint 7: Onboarding Wizard State (Zustand)
 */
import { create } from 'zustand';

export interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  businessName: string;
  businessType: string;
  storePlatform: string;
  storeUrl: string;
  storeConnected: boolean;
  importMethod: string;
  productsImported: number;
  onboardingCompleted: boolean;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: (step: number) => void;
  setBusinessInfo: (name: string, type: string) => void;
  setPlatform: (platform: string) => void;
  setStoreUrl: (url: string) => void;
  setStoreConnected: (connected: boolean) => void;
  setImportMethod: (method: string) => void;
  setProductsImported: (count: number) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

const TOTAL_STEPS = 4;

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 1,
  completedSteps: [],
  businessName: '',
  businessType: '',
  storePlatform: '',
  storeUrl: '',
  storeConnected: false,
  importMethod: '',
  productsImported: 0,
  onboardingCompleted: false,

  setStep: (step) => set({ currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)) }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, TOTAL_STEPS) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  completeStep: (step) => set((s) => ({
    completedSteps: s.completedSteps.includes(step) ? s.completedSteps : [...s.completedSteps, step],
  })),
  setBusinessInfo: (name, type) => set({ businessName: name, businessType: type }),
  setPlatform: (platform) => set({ storePlatform: platform }),
  setStoreUrl: (url) => set({ storeUrl: url }),
  setStoreConnected: (connected) => set({ storeConnected: connected }),
  setImportMethod: (method) => set({ importMethod: method }),
  setProductsImported: (count) => set({ productsImported: count }),
  completeOnboarding: () => set({ onboardingCompleted: true }),
  reset: () => set({
    currentStep: 1, completedSteps: [], businessName: '', businessType: '',
    storePlatform: '', storeUrl: '', storeConnected: false,
    importMethod: '', productsImported: 0, onboardingCompleted: false,
  }),
}));
