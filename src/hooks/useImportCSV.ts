// HOOK IMPORT CSV - Gestion complète avec erreurs et progression
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ImportLog, ImportStats, LogLevel } from '@/components/import/ImportProgressTracker';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  isManual: boolean;
}

interface UseImportCSVOptions {
  batchSize?: number;
  onProgress?: (stats: ImportStats) => void;
  onLog?: (log: ImportLog) => void;
  onComplete?: (stats: ImportStats) => void;
  onError?: (error: Error) => void;
}

interface ImportResult {
  success: boolean;
  stats: ImportStats;
  logs: ImportLog[];
}

export function useImportCSV(options: UseImportCSVOptions = {}) {
  const { 
    batchSize = 50,
    onProgress,
    onLog,
    onComplete,
    onError
  } = options;

  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
    warnings: 0,
    skipped: 0
  });
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = useCallback((
    level: LogLevel,
    message: string,
    details?: string,
    productName?: string,
    row?: number
  ) => {
    const log: ImportLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      details,
      productName,
      row
    };
    
    setLogs(prev => [...prev, log]);
    onLog?.(log);
    
    return log;
  }, [onLog]);

  const updateStats = useCallback((update: Partial<ImportStats>) => {
    setStats(prev => {
      const newStats = { ...prev, ...update };
      onProgress?.(newStats);
      return newStats;
    });
  }, [onProgress]);

  const parseCSV = useCallback((content: string): { headers: string[]; rows: Record<string, any>[] } => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Fichier CSV vide');
    }

    // Détection du délimiteur
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    const rows = lines.slice(1).map((line, index) => {
      const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, any> = {};
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      row.__rowIndex = index + 2; // +2 car on commence à 1 et on a sauté l'en-tête
      return row;
    });

    return { headers, rows };
  }, []);

  const validateRow = useCallback((
    row: Record<string, any>,
    mappings: FieldMapping[]
  ): { valid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérification des champs requis
    const requiredFields = ['name', 'price'];
    for (const field of requiredFields) {
      const mapping = mappings.find(m => m.targetField === field);
      if (!mapping) {
        errors.push(`Champ obligatoire non mappé: ${field}`);
        continue;
      }
      
      const value = row[mapping.sourceField];
      if (!value || value.toString().trim() === '') {
        errors.push(`Valeur manquante pour: ${field}`);
      }
    }

    // Validation du prix
    const priceMapping = mappings.find(m => m.targetField === 'price');
    if (priceMapping) {
      const priceValue = row[priceMapping.sourceField];
      const price = parseFloat(priceValue?.toString().replace(',', '.').replace(/[^\d.-]/g, '') || '0');
      if (isNaN(price) || price < 0) {
        errors.push(`Prix invalide: ${priceValue}`);
      } else if (price === 0) {
        warnings.push('Prix à 0 - vérifiez la valeur');
      }
    }

    // Validation du stock
    const stockMapping = mappings.find(m => m.targetField === 'stock');
    if (stockMapping) {
      const stockValue = row[stockMapping.sourceField];
      const stock = parseInt(stockValue?.toString().replace(/[^\d]/g, '') || '0', 10);
      if (isNaN(stock) || stock < 0) {
        warnings.push(`Stock invalide, défini à 0: ${stockValue}`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }, []);

  const transformRow = useCallback((
    row: Record<string, any>,
    mappings: FieldMapping[]
  ): Record<string, any> => {
    const transformed: Record<string, any> = {};

    for (const mapping of mappings) {
      if (!mapping.targetField) continue;

      let value = row[mapping.sourceField];

      // Transformations selon le type de champ
      switch (mapping.targetField) {
        case 'price':
        case 'cost_price':
        case 'weight':
          value = parseFloat(value?.toString().replace(',', '.').replace(/[^\d.-]/g, '') || '0');
          break;
        case 'stock':
          value = parseInt(value?.toString().replace(/[^\d]/g, '') || '0', 10);
          break;
        case 'images':
        case 'tags':
          if (typeof value === 'string') {
            value = value.split(/[,;|]/).map(v => v.trim()).filter(v => v);
          }
          break;
        default:
          value = value?.toString().trim() || null;
      }

      transformed[mapping.targetField] = value;
    }

    return transformed;
  }, []);

  const importCSV = useCallback(async (
    file: File,
    mappings: FieldMapping[]
  ): Promise<ImportResult> => {
    setIsImporting(true);
    setLogs([]);
    abortControllerRef.current = new AbortController();

    const initialStats: ImportStats = {
      total: 0,
      processed: 0,
      success: 0,
      errors: 0,
      warnings: 0,
      skipped: 0
    };
    setStats(initialStats);

    try {
      // Étape 1: Lecture du fichier
      setCurrentStep('Lecture du fichier...');
      addLog('info', 'Début de l\'import', `Fichier: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

      const content = await file.text();
      const { headers, rows } = parseCSV(content);

      addLog('info', 'Fichier parsé', `${rows.length} lignes détectées, ${headers.length} colonnes`);
      updateStats({ total: rows.length });

      // Étape 2: Validation et transformation
      setCurrentStep('Validation des données...');
      const validProducts: { data: Record<string, any>; row: number }[] = [];
      const failedRows: { row: number; errors: string[] }[] = [];

      for (let i = 0; i < rows.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          addLog('warning', 'Import annulé par l\'utilisateur');
          break;
        }

        const row = rows[i];
        const rowIndex = row.__rowIndex || i + 2;
        const nameValue = row[mappings.find(m => m.targetField === 'name')?.sourceField || ''] || `Produit ligne ${rowIndex}`;

        const { valid, errors, warnings } = validateRow(row, mappings);

        // Log des avertissements
        warnings.forEach(w => {
          addLog('warning', w, undefined, nameValue, rowIndex);
        });

        if (!valid) {
          errors.forEach(e => addLog('error', e, undefined, nameValue, rowIndex));
          failedRows.push({ row: rowIndex, errors });
          continue;
        }

        const transformed = transformRow(row, mappings);
        validProducts.push({ data: transformed, row: rowIndex });
      }

      addLog('info', 'Validation terminée', `${validProducts.length} produits valides, ${failedRows.length} erreurs`);

      // Étape 3: Import par batch
      setCurrentStep('Import des produits...');
      let successCount = 0;

      for (let i = 0; i < validProducts.length; i += batchSize) {
        if (abortControllerRef.current?.signal.aborted) break;

        const batch = validProducts.slice(i, i + batchSize);
        setCurrentStep(`Import batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validProducts.length / batchSize)}`);

        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) throw new Error('Utilisateur non connecté');

          const productsToInsert = batch.map(p => ({
            name: p.data.name || 'Produit sans nom',
            price: p.data.price || 0,
            description: p.data.description || null,
            sku: p.data.sku || null,
            category: p.data.category || null,
            brand: p.data.brand || null,
            image_url: p.data.image_url || p.data.images?.[0] || null,
            stock_quantity: p.data.stock || 0,
            user_id: userData.user!.id
          }));

          const { error: insertError } = await supabase
            .from('imported_products')
            .insert(productsToInsert);

          if (insertError) throw insertError;

          batch.forEach(p => {
            addLog('success', 'Produit importé', undefined, p.data.name, p.row);
            successCount++;
          });

          updateStats({
            processed: stats.processed + batch.length,
            success: stats.success + batch.length
          });

        } catch (batchError) {
          console.error('Batch error:', batchError);
          batch.forEach(p => {
            addLog('error', 'Erreur d\'import', (batchError as Error).message, p.data.name, p.row);
          });
          updateStats({
            processed: stats.processed + batch.length,
            errors: stats.errors + batch.length
          });
        }

        // Petit délai entre les batches
        await new Promise(r => setTimeout(r, 100));
      }

      // Résultat final
      const finalStats = {
        total: rows.length,
        processed: rows.length,
        success: successCount,
        errors: failedRows.length + (validProducts.length - successCount),
        warnings: logs.filter(l => l.level === 'warning').length,
        skipped: 0
      };

      setStats(finalStats);
      setCurrentStep('');

      if (finalStats.errors === 0) {
        addLog('success', 'Import terminé avec succès !', `${finalStats.success} produits importés`);
        toast.success(`${finalStats.success} produits importés avec succès`);
      } else {
        addLog('warning', 'Import terminé avec des erreurs', `${finalStats.success} réussis, ${finalStats.errors} erreurs`);
        toast.warning(`Import terminé: ${finalStats.success} réussis, ${finalStats.errors} erreurs`);
      }

      onComplete?.(finalStats);
      return { success: true, stats: finalStats, logs };

    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = (error as Error).message || 'Erreur inconnue';
      addLog('error', 'Erreur fatale', errorMessage);
      toast.error(`Erreur d'import: ${errorMessage}`);
      onError?.(error as Error);
      return { success: false, stats, logs };
    } finally {
      setIsImporting(false);
      abortControllerRef.current = null;
    }
  }, [addLog, updateStats, parseCSV, validateRow, transformRow, batchSize, onComplete, onError, logs, stats]);

  const cancelImport = useCallback(() => {
    abortControllerRef.current?.abort();
    addLog('warning', 'Annulation demandée...');
  }, [addLog]);

  const reset = useCallback(() => {
    setStats({
      total: 0,
      processed: 0,
      success: 0,
      errors: 0,
      warnings: 0,
      skipped: 0
    });
    setLogs([]);
    setCurrentStep('');
  }, []);

  return {
    isImporting,
    stats,
    logs,
    currentStep,
    importCSV,
    cancelImport,
    reset,
    parseCSV
  };
}

export default useImportCSV;
