// TEMPORARY WRAPPER - Will be removed after full migration
// This file exports UnifiedAuthContext with the old name for backwards compatibility

export { 
  useUnifiedAuth as useAuth,
  UnifiedAuthProvider as AuthProvider,
  type Profile
} from './UnifiedAuthContext';
