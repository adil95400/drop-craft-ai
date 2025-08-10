import { toast } from '@/hooks/use-toast';

// Helper functions for common actions with proper error handling
export class ActionHelpers {
  
  // Generic action wrapper with loading state and error handling
  static async executeAction<T>(
    action: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
    }
  ): Promise<T | null> {
    const {
      loadingMessage,
      successMessage,
      errorMessage = "Une erreur est survenue",
      onSuccess,
      onError
    } = options || {};

    try {
      if (loadingMessage) {
        toast({
          title: "En cours...",
          description: loadingMessage,
        });
      }

      const result = await action();

      if (successMessage) {
        toast({
          title: "Succès",
          description: successMessage,
        });
      }

      onSuccess?.(result);
      return result;
    } catch (error) {
      console.error('Action failed:', error);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });

      onError?.(error);
      return null;
    }
  }

  // File upload helper
  static async handleFileUpload(
    file: File,
    options?: {
      maxSize?: number; // in MB
      allowedTypes?: string[];
      onSuccess?: (url: string) => void;
    }
  ) {
    const { maxSize = 10, allowedTypes = ['image/*', 'text/csv', 'application/json'], onSuccess } = options || {};

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: `Le fichier est trop volumineux (max: ${maxSize}MB)`,
        variant: "destructive"
      });
      return null;
    }

    // Validate file type
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isValidType) {
      toast({
        title: "Erreur",
        description: "Type de fichier non supporté",
        variant: "destructive"
      });
      return null;
    }

    return this.executeAction(
      async () => {
        // Implementation would depend on your file upload service
        // For now, return a mock URL
        return URL.createObjectURL(file);
      },
      {
        loadingMessage: "Upload en cours...",
        successMessage: "Fichier uploadé avec succès",
        errorMessage: "Erreur lors de l'upload",
        onSuccess: onSuccess
      }
    );
  }

  // Export data helper
  static async exportData(
    data: any[],
    filename: string,
    format: 'csv' | 'json' = 'csv'
  ) {
    return this.executeAction(
      async () => {
        let content = '';
        let mimeType = '';

        if (format === 'csv') {
          // Convert to CSV
          if (data.length === 0) return;
          
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map(item => 
            Object.values(item).map(value => 
              typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
            ).join(',')
          );
          
          content = [headers, ...rows].join('\n');
          mimeType = 'text/csv';
        } else {
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
      },
      {
        successMessage: `Export ${format.toUpperCase()} terminé`,
        errorMessage: "Erreur lors de l'export"
      }
    );
  }

  // Import data helper
  static async importData(
    file: File,
    onData: (data: any[]) => void
  ) {
    return this.executeAction(
      async () => {
        const text = await file.text();
        let data: any[] = [];

        if (file.type === 'application/json') {
          data = JSON.parse(text);
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          // Simple CSV parser
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = values[index] || '';
              });
              return obj;
            });
        }

        onData(data);
        return data;
      },
      {
        loadingMessage: "Import en cours...",
        successMessage: "Import terminé avec succès",
        errorMessage: "Erreur lors de l'import"
      }
    );
  }

  // Copy to clipboard helper
  static async copyToClipboard(text: string) {
    return this.executeAction(
      async () => {
        await navigator.clipboard.writeText(text);
      },
      {
        successMessage: "Copié dans le presse-papier",
        errorMessage: "Impossible de copier"
      }
    );
  }

  // Bulk operations helper
  static async executeBulkAction<T>(
    items: T[],
    action: (item: T) => Promise<void>,
    options?: {
      batchSize?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ) {
    const { batchSize = 10, onProgress } = options || {};
    const total = items.length;
    let completed = 0;

    return this.executeAction(
      async () => {
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          
          await Promise.all(
            batch.map(async (item) => {
              await action(item);
              completed++;
              onProgress?.(completed, total);
            })
          );
        }
      },
      {
        loadingMessage: `Traitement de ${total} éléments...`,
        successMessage: `${total} éléments traités avec succès`,
        errorMessage: "Erreur lors du traitement en lot"
      }
    );
  }
}