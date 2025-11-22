import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { importExportService } from '@/services/importExportService';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

/**
 * Hook centralisé pour toutes les actions produits
 * Gère import, export, et autres actions communes
 */
export function useProductActions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Ouvrir la page d'import
   */
  const handleImport = () => {
    navigate('/products/import/quick');
  };

  /**
   * Export CSV des produits sélectionnés ou tous les produits
   */
  const handleExport = async (productIds?: string[]) => {
    if (!user) {
      toast({
        title: 'Non connecté',
        description: 'Vous devez être connecté pour exporter',
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);
    try {
      if (productIds && productIds.length > 0) {
        // Export sélection
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (error) throw error;

        importExportService.exportToCSV(
          products || [],
          `produits_selection_${new Date().toISOString().split('T')[0]}.csv`
        );

        toast({
          title: 'Export réussi',
          description: `${products?.length || 0} produits exportés`
        });
      } else {
        // Export tous les produits
        await importExportService.exportAllProducts(user.id);
        
        toast({
          title: 'Export réussi',
          description: 'Tous vos produits ont été exportés'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur d\'export',
        description: error instanceof Error ? error.message : 'Impossible d\'exporter les produits',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Import depuis fichier CSV
   */
  const handleImportCSV = async (file: File) => {
    if (!user) {
      toast({
        title: 'Non connecté',
        description: 'Vous devez être connecté pour importer',
        variant: 'destructive'
      });
      return { success: false };
    }

    setIsImporting(true);
    try {
      const result = await importExportService.importFromCSV(file, user.id);
      
      if (result.success) {
        toast({
          title: 'Import réussi',
          description: `${result.imported} produits importés`
        });
      } else {
        toast({
          title: 'Import échoué',
          description: result.errors.join(', '),
          variant: 'destructive'
        });
      }
      
      return result;
    } catch (error) {
      toast({
        title: 'Erreur d\'import',
        description: error instanceof Error ? error.message : 'Impossible d\'importer les produits',
        variant: 'destructive'
      });
      return { success: false, imported: 0, errors: [String(error)] };
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Télécharger le template CSV
   */
  const downloadTemplate = () => {
    importExportService.downloadTemplate();
    toast({
      title: 'Template téléchargé',
      description: 'Utilisez ce fichier comme modèle pour vos imports'
    });
  };

  /**
   * Aller à la page d'import avancé
   */
  const goToAdvancedImport = () => {
    navigate('/products/import/advanced');
  };

  /**
   * Aller à la page de gestion des imports
   */
  const goToImportManagement = () => {
    navigate('/products/import/manage');
  };

  return {
    handleImport,
    handleExport,
    handleImportCSV,
    downloadTemplate,
    goToAdvancedImport,
    goToImportManagement,
    isImporting,
    isExporting
  };
}
