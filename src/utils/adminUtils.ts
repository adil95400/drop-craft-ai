export type UserRole = 'admin' | 'user';
export type AdminMode = 'bypass' | 'preview:standard' | 'preview:pro' | 'preview:ultra_pro' | null;
export type PlanType = 'standard' | 'pro' | 'ultra_pro';

export interface UserProfile {
  plan: PlanType;
  role: UserRole;
  admin_mode: AdminMode;
}

export function getEffectivePlan(profile: UserProfile): PlanType {
  // Admin always gets ultra_pro access
  if (profile.role === 'admin') {
    // If admin has specific mode, respect it, otherwise give ultra_pro
    if (profile.admin_mode === 'bypass') {
      return 'ultra_pro';
    }
    
    if (profile.admin_mode?.startsWith('preview:')) {
      const previewPlan = profile.admin_mode.split(':')[1] as PlanType;
      return previewPlan;
    }
    
    // Default admin access is ultra_pro
    return 'ultra_pro';
  }
  
  // Non-admin users get their normal plan
  return profile.plan;
}

export function canAccessFeature(feature: string, plan: PlanType, role?: UserRole): boolean {
  // Admin has access to all features
  if (role === 'admin') return true;
  
  const planHierarchy = { standard: 0, pro: 1, ultra_pro: 2 };
  
  // Feature to minimum plan mapping
  const featureRequirements: Record<string, PlanType> = {
    'basic-analytics': 'standard',
    'advanced-analytics': 'pro',
    'ai-analysis': 'pro',
    'bulk-operations': 'ultra_pro',
    'premium-integrations': 'ultra_pro',
    'advanced-automation': 'ultra_pro'
  };
  
  const requiredPlan = featureRequirements[feature] || 'standard';
  return planHierarchy[plan] >= planHierarchy[requiredPlan];
}

export const ADMIN_MODE_OPTIONS: AdminMode[] = [
  null,
  'bypass',
  'preview:standard',
  'preview:pro',
  'preview:ultra_pro'
];

export const ADMIN_MODE_CONFIG = [
  { value: null, label: 'Mode Normal' },
  { value: 'bypass', label: 'Bypass (Ultra Pro)' },
  { value: 'preview:standard', label: 'Aperçu Standard' },
  { value: 'preview:pro', label: 'Aperçu Pro' },
  { value: 'preview:ultra_pro', label: 'Aperçu Ultra Pro' }
];

export function getAdminModeLabel(mode: AdminMode): string {
  switch (mode) {
    case null:
      return 'Mode Normal';
    case 'bypass':
      return 'Bypass (Ultra Pro)';
    case 'preview:standard':
      return 'Aperçu Standard';
    case 'preview:pro':
      return 'Aperçu Pro';
    case 'preview:ultra_pro':
      return 'Aperçu Ultra Pro';
    default:
      return 'Mode Inconnu';
  }
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function isInPreviewMode(adminMode: AdminMode): boolean {
  return adminMode?.startsWith('preview:') || false;
}

export function formatPlanName(plan: PlanType): string {
  switch (plan) {
    case 'standard':
      return 'Standard';
    case 'pro':
      return 'Pro';
    case 'ultra_pro':
      return 'Ultra Pro';
    default:
      return 'Unknown';
  }
}