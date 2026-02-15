import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctionUrl } from '@/lib/supabase-env';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

type ExportType = 'products' | 'orders' | 'customers';
type ExportFormat = 'csv' | 'json';

export function useDataExport() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (
    type: ExportType, 
    format: ExportFormat = 'csv',
    filters?: { ids?: string[] }
  ) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return { success: false };
    }

    setIsExporting(true);
    try {
      const response = await fetch(
        edgeFunctionUrl('export-data'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type, format, filters })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Export ${type} réussi`);
      return { success: true };
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'export');
      return { success: false, error };
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting
  };
}
