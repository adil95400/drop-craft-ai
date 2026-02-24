/**
 * Tests critiques — Onboarding Store (Zustand)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useOnboardingStore } from '@/stores/onboardingStore';

describe('OnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it('should initialize with default values', () => {
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.completedSteps).toEqual([]);
    expect(state.onboardingCompleted).toBe(false);
    expect(state.businessName).toBe('');
  });

  it('should advance to next step', () => {
    const store = useOnboardingStore.getState();
    store.nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe(2);
  });

  it('should not exceed max steps', () => {
    const store = useOnboardingStore.getState();
    store.setStep(4);
    store.nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe(4);
  });

  it('should not go below step 1', () => {
    const store = useOnboardingStore.getState();
    store.prevStep();
    expect(useOnboardingStore.getState().currentStep).toBe(1);
  });

  it('should complete a step without duplicates', () => {
    const store = useOnboardingStore.getState();
    store.completeStep(1);
    store.completeStep(1);
    expect(useOnboardingStore.getState().completedSteps).toEqual([1]);
  });

  it('should set business info', () => {
    const store = useOnboardingStore.getState();
    store.setBusinessInfo('Ma Boutique', 'dropshipping');
    const state = useOnboardingStore.getState();
    expect(state.businessName).toBe('Ma Boutique');
    expect(state.businessType).toBe('dropshipping');
  });

  it('should set platform and store URL', () => {
    const store = useOnboardingStore.getState();
    store.setPlatform('shopify');
    store.setStoreUrl('https://mystore.myshopify.com');
    const state = useOnboardingStore.getState();
    expect(state.storePlatform).toBe('shopify');
    expect(state.storeUrl).toBe('https://mystore.myshopify.com');
  });

  it('should complete onboarding', () => {
    const store = useOnboardingStore.getState();
    store.completeOnboarding();
    expect(useOnboardingStore.getState().onboardingCompleted).toBe(true);
  });

  it('should reset all state', () => {
    const store = useOnboardingStore.getState();
    store.setBusinessInfo('Test', 'ecommerce');
    store.setPlatform('woocommerce');
    store.nextStep();
    store.completeStep(1);
    store.completeOnboarding();
    
    store.reset();
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.completedSteps).toEqual([]);
    expect(state.businessName).toBe('');
    expect(state.onboardingCompleted).toBe(false);
  });
});
