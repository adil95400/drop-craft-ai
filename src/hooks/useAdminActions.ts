/**
 * Hook pour toutes les actions d'administration
 */
import { AdminService } from '@/services/adminServices';
import { toast } from '@/hooks/use-toast';

export const useAdminActions = () => {
  // Actions rapides d'administration
  const updateData = async () => {
    try {
      const result = await AdminService.updateData();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const backupDatabase = async () => {
    try {
      const result = await AdminService.backupDatabase();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const runSecurityScan = async () => {
    try {
      const result = await AdminService.runSecurityScan();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const exportData = async () => {
    try {
      const result = await AdminService.exportData();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Actions de maintenance
  const updateStatistics = async () => {
    try {
      const result = await AdminService.updateStatistics();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const verifyIntegrity = async () => {
    try {
      const result = await AdminService.verifyIntegrity();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const optimizeIndex = async () => {
    try {
      const result = await AdminService.optimizeIndex();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const cleanOldLogs = async () => {
    try {
      const result = await AdminService.cleanOldLogs();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Actions système avancées
  const restartServices = async () => {
    try {
      const result = await AdminService.restartServices();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const clearCache = async () => {
    try {
      const result = await AdminService.clearCache();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const optimizeSystem = async () => {
    try {
      const result = await AdminService.optimizeSystem();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const runHealthCheck = async () => {
    try {
      const result = await AdminService.runHealthCheck();
      toast({
        title: "Succès",
        description: result.message,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    // Actions rapides
    updateData,
    backupDatabase,
    runSecurityScan,
    exportData,
    
    // Actions de maintenance
    updateStatistics,
    verifyIntegrity,
    optimizeIndex,
    cleanOldLogs,
    
    // Actions système avancées
    restartServices,
    clearCache,
    optimizeSystem,
    runHealthCheck,
  };
};