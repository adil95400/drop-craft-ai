import { PlanType } from '@/hooks/usePlan';

export type UserRole = 'admin' | 'user';
export type AdminMode = null | 'bypass' | 'preview:standard' | 'preview:pro' | 'preview:ultra_pro';

export interface UserProfile {
  role: UserRole;
  plan: PlanType;
  admin_mode?: AdminMode;
}

export function getEffectivePlan(profile: UserProfile): PlanType {
  if (profile.role !== 'admin' || !profile.admin_mode) {
    return profile.plan;
  }
  
  if (profile.admin_mode === 'bypass') {
    return 'ultra_pro';
  }
  
  if (profile.admin_mode?.startsWith('preview:')) {
    const previewPlan = profile.admin_mode.split(':')[1] as PlanType;
    return previewPlan;
  }
  
  return profile.plan;
}

export function isAdmin(profile?: UserProfile): boolean {
  return profile?.role === 'admin';
}

export function isInBypassMode(profile?: UserProfile): boolean {
  return isAdmin(profile) && profile?.admin_mode === 'bypass';
}

export function isInPreviewMode(profile?: UserProfile): boolean {
  return isAdmin(profile) && profile?.admin_mode?.startsWith('preview:') || false;
}

export function getAdminModeLabel(adminMode: AdminMode): string {
  if (!adminMode) return 'Mode normal';
  if (adminMode === 'bypass') return 'Accès complet (admin)';
  if (adminMode === 'preview:standard') return 'Prévisualiser : Standard';
  if (adminMode === 'preview:pro') return 'Prévisualiser : Pro';
  if (adminMode === 'preview:ultra_pro') return 'Prévisualiser : Ultra';
  return 'Mode inconnu';
}

export const ADMIN_MODE_OPTIONS = [
  { value: 'bypass', label: 'Accès complet (admin)' },
  { value: 'preview:standard', label: 'Prévisualiser : Standard' },
  { value: 'preview:pro', label: 'Prévisualiser : Pro' },
  { value: 'preview:ultra_pro', label: 'Prévisualiser : Ultra' },
] as const;