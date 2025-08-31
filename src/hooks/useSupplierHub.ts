import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supplierHub } from '@/services/SupplierHub';
import { importManager } from '@/services/ImportManager';
import type { SupplierConnectorInfo, SyncSchedule } from '@/services/SupplierHub';
import type { ImportTemplate } from '@/services/ImportManager';

export const useSupplierHub = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available connectors
  const { data: connectors = [], isLoading: connectorsLoading } = useQuery({
    queryKey: ['supplier-connectors'],
    queryFn: () => supplierHub.getAvailableConnectors(),
  });

  // Get sync schedules
  const { data: syncSchedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['sync-schedules'],
    queryFn: () => supplierHub.getSyncSchedules(),
  });

  // Get import templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['import-templates'],
    queryFn: () => importManager.getTemplates(),
  });

  // Connect supplier mutation
  const connectSupplier = useMutation({
    mutationFn: async ({ connectorId, credentials }: { connectorId: string; credentials: Record<string, string> }) => {
      return await supplierHub.connectSupplier(connectorId, credentials);
    },
    onSuccess: (success, { connectorId }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['supplier-connectors'] });
        const connector = connectors.find(c => c.id === connectorId);
        toast({
          title: "Connexion réussie",
          description: `${connector?.displayName} a été connecté avec succès`,
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Vérifiez vos identifiants et réessayez",
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Erreur de connexion",
        description: "Une erreur s'est produite lors de la connexion",
        variant: "destructive"
      });
    }
  });

  // Disconnect supplier mutation
  const disconnectSupplier = useMutation({
    mutationFn: async (connectorId: string) => {
      return await supplierHub.disconnectSupplier(connectorId);
    },
    onSuccess: (success, connectorId) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['supplier-connectors'] });
        const connector = connectors.find(c => c.id === connectorId);
        toast({
          title: "Déconnexion réussie",
          description: `${connector?.displayName} a été déconnecté`,
        });
      }
    }
  });

  // Sync supplier products mutation
  const syncSupplierProducts = useMutation({
    mutationFn: async ({ 
      connectorId, 
      options 
    }: { 
      connectorId: string; 
      options?: { fullSync?: boolean; category?: string; limit?: number } 
    }) => {
      return await supplierHub.syncSupplierProducts(connectorId, options);
    },
    onSuccess: (result, { connectorId }) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      const connector = connectors.find(c => c.id === connectorId);
      toast({
        title: "Synchronisation terminée",
        description: `${result.imported} produits importés depuis ${connector?.displayName}`,
      });
    },
    onError: (error, { connectorId }) => {
      const connector = connectors.find(c => c.id === connectorId);
      toast({
        title: "Erreur de synchronisation",
        description: `Impossible de synchroniser ${connector?.displayName}`,
        variant: "destructive"
      });
    }
  });

  // Schedule sync mutation
  const scheduleSync = useMutation({
    mutationFn: async (schedule: SyncSchedule) => {
      return await supplierHub.scheduleSync(schedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-schedules'] });
      toast({
        title: "Planification sauvegardée",
        description: "La synchronisation automatique a été configurée",
      });
    }
  });

  // Manual sync trigger mutation
  const triggerManualSync = useMutation({
    mutationFn: async (connectorId: string) => {
      return await supplierHub.triggerManualSync(connectorId);
    },
    onSuccess: (_, connectorId) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      const connector = connectors.find(c => c.id === connectorId);
      toast({
        title: "Synchronisation démarrée",
        description: `Synchronisation manuelle lancée pour ${connector?.displayName}`,
      });
    }
  });

  // Create import template mutation
  const createTemplate = useMutation({
    mutationFn: async (template: Omit<ImportTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      return await importManager.createTemplate(template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-templates'] });
      toast({
        title: "Template créé",
        description: "Le template d'import a été sauvegardé",
      });
    }
  });

  // Update import template mutation
  const updateTemplate = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ImportTemplate> }) => {
      return await importManager.updateTemplate(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-templates'] });
      toast({
        title: "Template mis à jour",
        description: "Le template d'import a été modifié",
      });
    }
  });

  // Delete import template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      return await importManager.deleteTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-templates'] });
      toast({
        title: "Template supprimé",
        description: "Le template d'import a été supprimé",
      });
    }
  });

  // Import from various sources
  const importFromUrl = useMutation({
    mutationFn: async ({ 
      url, 
      template, 
      config 
    }: { 
      url: string; 
      template?: ImportTemplate; 
      config?: any 
    }) => {
      return await importManager.importFromUrl(url, template, config);
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
      toast({
        title: "Import démarré",
        description: `Import depuis l'URL en cours (${job.total_rows} lignes)`,
      });
    }
  });

  const importFromXml = useMutation({
    mutationFn: async ({ 
      xmlUrl, 
      template, 
      config 
    }: { 
      xmlUrl: string; 
      template?: ImportTemplate; 
      config?: any 
    }) => {
      return await importManager.importFromXml(xmlUrl, template, config);
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
      toast({
        title: "Import XML démarré",
        description: `Import depuis XML en cours (${job.total_rows} lignes)`,
      });
    }
  });

  const importFromCsv = useMutation({
    mutationFn: async ({ 
      fileData, 
      template, 
      config 
    }: { 
      fileData: any[]; 
      template?: ImportTemplate; 
      config?: any 
    }) => {
      return await importManager.importFromCsv(fileData, template, config);
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
      toast({
        title: "Import CSV terminé",
        description: `${job.success_rows} produits importés avec succès`,
      });
    }
  });

  const importFromFtp = useMutation({
    mutationFn: async ({ 
      ftpUrl, 
      username, 
      password, 
      filePath, 
      fileType, 
      template, 
      config 
    }: { 
      ftpUrl: string; 
      username: string; 
      password: string; 
      filePath: string; 
      fileType: 'csv' | 'xml' | 'json'; 
      template?: ImportTemplate; 
      config?: any 
    }) => {
      return await importManager.importFromFtp(ftpUrl, username, password, filePath, fileType, template, config);
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
      toast({
        title: "Import FTP démarré",
        description: `Import depuis FTP en cours (${job.total_rows} lignes)`,
      });
    }
  });

  // Auto-detect fields helper
  const autoDetectFields = async (sampleData: any[], fileType: string) => {
    return await importManager.autoDetectFields(sampleData, fileType);
  };

  // Statistics
  const stats = {
    totalConnectors: connectors.length,
    availableConnectors: connectors.filter(c => c.status === 'available').length,
    betaConnectors: connectors.filter(c => c.status === 'beta').length,
    comingSoonConnectors: connectors.filter(c => c.status === 'coming_soon').length,
    totalTemplates: templates.length,
    activeSchedules: syncSchedules.filter(s => s.enabled).length,
  };

  return {
    // Data
    connectors,
    syncSchedules,
    templates,
    stats,
    
    // Loading states
    isLoading: connectorsLoading || schedulesLoading || templatesLoading,
    
    // Mutations and their states
    connectSupplier: {
      mutate: connectSupplier.mutate,
      isPending: connectSupplier.isPending,
    },
    disconnectSupplier: {
      mutate: disconnectSupplier.mutate,
      isPending: disconnectSupplier.isPending,
    },
    syncSupplierProducts: {
      mutate: syncSupplierProducts.mutate,
      isPending: syncSupplierProducts.isPending,
    },
    scheduleSync: {
      mutate: scheduleSync.mutate,
      isPending: scheduleSync.isPending,
    },
    triggerManualSync: {
      mutate: triggerManualSync.mutate,
      isPending: triggerManualSync.isPending,
    },
    
    // Template management
    createTemplate: {
      mutate: createTemplate.mutate,
      isPending: createTemplate.isPending,
    },
    updateTemplate: {
      mutate: updateTemplate.mutate,
      isPending: updateTemplate.isPending,
    },
    deleteTemplate: {
      mutate: deleteTemplate.mutate,
      isPending: deleteTemplate.isPending,
    },
    
    // Import methods
    importFromUrl: {
      mutate: importFromUrl.mutate,
      isPending: importFromUrl.isPending,
    },
    importFromXml: {
      mutate: importFromXml.mutate,
      isPending: importFromXml.isPending,
    },
    importFromCsv: {
      mutate: importFromCsv.mutate,
      isPending: importFromCsv.isPending,
    },
    importFromFtp: {
      mutate: importFromFtp.mutate,
      isPending: importFromFtp.isPending,
    },
    
    // Utilities
    autoDetectFields,
  };
};