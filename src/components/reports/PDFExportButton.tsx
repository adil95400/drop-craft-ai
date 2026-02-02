/**
 * Bouton d'export PDF pour les rapports
 * Composant réutilisable avec options de configuration
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, Download, Loader2, ChevronDown,
  Calendar, BarChart3, Table, FileSpreadsheet
} from 'lucide-react';
import { usePDFExport } from '@/hooks/usePDFExport';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  label: string;
  format?: 'currency' | 'number' | 'percent' | 'date';
}

interface PDFExportButtonProps {
  title: string;
  subtitle?: string;
  data: Record<string, any>[];
  columns: Column[];
  summary?: { label: string; value: string | number }[];
  dateRange?: { start: string; end: string };
  chartRefs?: React.RefObject<HTMLElement>[];
  chartTitles?: string[];
  fileName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showDropdown?: boolean;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
}

export function PDFExportButton({
  title,
  subtitle,
  data,
  columns,
  summary,
  dateRange,
  chartRefs = [],
  chartTitles = [],
  fileName,
  className,
  variant = 'outline',
  size = 'default',
  showDropdown = true,
  onExportCSV,
  onExportExcel,
}: PDFExportButtonProps) {
  const { exportToPDF, captureChartAsImage, isExporting } = usePDFExport();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleExportPDF = async (includeCharts: boolean = true) => {
    setIsCapturing(true);
    
    try {
      // Capture charts if refs provided
      const charts: { title: string; imageData: string }[] = [];
      
      if (includeCharts && chartRefs.length > 0) {
        for (let i = 0; i < chartRefs.length; i++) {
          const ref = chartRefs[i];
          if (ref?.current) {
            const imageData = await captureChartAsImage(ref.current);
            if (imageData) {
              charts.push({
                title: chartTitles[i] || `Graphique ${i + 1}`,
                imageData,
              });
            }
          }
        }
      }

      await exportToPDF({
        title,
        subtitle,
        dateRange,
        data,
        columns,
        summary,
        charts: includeCharts ? charts : undefined,
        orientation: data.length > 10 || columns.length > 5 ? 'landscape' : 'portrait',
        fileName,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const isLoading = isExporting || isCapturing;

  if (!showDropdown) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExportPDF(true)}
        disabled={isLoading || data.length === 0}
        className={cn("gap-2", className)}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {size !== 'icon' && 'Export PDF'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isLoading || data.length === 0}
          className={cn("gap-2", className)}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {size !== 'icon' && 'Exporter'}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleExportPDF(true)}
          disabled={isLoading}
          className="gap-2"
        >
          <FileText className="h-4 w-4 text-red-500" />
          <div className="flex flex-col">
            <span>PDF Complet</span>
            <span className="text-xs text-muted-foreground">Avec graphiques</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExportPDF(false)}
          disabled={isLoading}
          className="gap-2"
        >
          <Table className="h-4 w-4 text-red-500" />
          <div className="flex flex-col">
            <span>PDF Données</span>
            <span className="text-xs text-muted-foreground">Tableaux uniquement</span>
          </div>
        </DropdownMenuItem>
        
        {onExportCSV && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportCSV} className="gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-500" />
              <span>CSV</span>
            </DropdownMenuItem>
          </>
        )}
        
        {onExportExcel && (
          <DropdownMenuItem onClick={onExportExcel} className="gap-2">
            <BarChart3 className="h-4 w-4 text-green-600" />
            <span>Excel</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PDFExportButton;
