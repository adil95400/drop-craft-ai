/**
 * Hook pour l'export PDF des rapports
 * Utilise jsPDF et jspdf-autotable pour générer des rapports professionnels
 */
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: { start: string; end: string };
  data: Record<string, any>[];
  columns: { key: string; label: string; format?: 'currency' | 'number' | 'percent' | 'date' }[];
  summary?: { label: string; value: string | number }[];
  charts?: { title: string; imageData: string }[];
  orientation?: 'portrait' | 'landscape';
  fileName?: string;
}

export function usePDFExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = useCallback(async (options: PDFExportOptions) => {
    setIsExporting(true);
    
    try {
      // Import dynamique pour réduire le bundle initial
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = 20;

      // === HEADER ===
      // Logo (placeholder gradient)
      doc.setFillColor(99, 102, 241); // Primary color
      doc.roundedRect(margin, yPosition - 5, 30, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ShopOpti', margin + 5, yPosition + 2);

      // Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.text(options.title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Subtitle
      if (options.subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(options.subtitle, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 6;
      }

      // Date range
      if (options.dateRange) {
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        const dateText = `Période: ${formatDate(options.dateRange.start)} - ${formatDate(options.dateRange.end)}`;
        doc.text(dateText, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 6;
      }

      // Generated date
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // === SUMMARY CARDS ===
      if (options.summary && options.summary.length > 0) {
        const cardWidth = (pageWidth - 2 * margin - (options.summary.length - 1) * 5) / options.summary.length;
        
        options.summary.forEach((item, index) => {
          const cardX = margin + index * (cardWidth + 5);
          
          // Card background
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(cardX, yPosition, cardWidth, 20, 2, 2, 'F');
          
          // Card border
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(cardX, yPosition, cardWidth, 20, 2, 2, 'S');
          
          // Label
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(item.label, cardX + cardWidth / 2, yPosition + 7, { align: 'center' });
          
          // Value
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(String(item.value), cardX + cardWidth / 2, yPosition + 15, { align: 'center' });
        });
        
        yPosition += 30;
        doc.setFont('helvetica', 'normal');
      }

      // === CHARTS ===
      if (options.charts && options.charts.length > 0) {
        for (const chart of options.charts) {
          // Check if we need a new page
          if (yPosition > doc.internal.pageSize.getHeight() - 80) {
            doc.addPage();
            yPosition = 20;
          }

          // Chart title
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(chart.title, margin, yPosition);
          yPosition += 5;

          // Chart image
          const chartWidth = pageWidth - 2 * margin;
          const chartHeight = 60;
          doc.addImage(chart.imageData, 'PNG', margin, yPosition, chartWidth, chartHeight);
          yPosition += chartHeight + 10;
        }
      }

      // === DATA TABLE ===
      if (options.data.length > 0) {
        // Check if we need a new page
        if (yPosition > doc.internal.pageSize.getHeight() - 60) {
          doc.addPage();
          yPosition = 20;
        }

        // Table title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Données détaillées', margin, yPosition);
        yPosition += 8;

        // Prepare table data
        const tableHeaders = options.columns.map(col => col.label);
        const tableBody = options.data.map(row => 
          options.columns.map(col => formatValue(row[col.key], col.format))
        );

        // Generate table
        autoTable(doc, {
          head: [tableHeaders],
          body: tableBody,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [99, 102, 241],
            textColor: 255,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          didDrawPage: (data) => {
            // Footer on each page
            const pageCount = doc.internal.pages.length - 1;
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Page ${data.pageNumber} sur ${pageCount}`,
              pageWidth / 2,
              doc.internal.pageSize.getHeight() - 10,
              { align: 'center' }
            );
          },
        });
      }

      // === SAVE ===
      const fileName = options.fileName || `rapport-shopopti-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('Rapport PDF exporté avec succès');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const captureChartAsImage = useCallback(async (chartElement: HTMLElement): Promise<string> => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Chart capture error:', error);
      return '';
    }
  }, []);

  return {
    exportToPDF,
    captureChartAsImage,
    isExporting,
  };
}

// Helpers
function formatValue(value: any, format?: 'currency' | 'number' | 'percent' | 'date'): string {
  if (value === null || value === undefined) return '-';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
    case 'number':
      return new Intl.NumberFormat('fr-FR').format(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'date':
      return new Date(value).toLocaleDateString('fr-FR');
    default:
      return String(value);
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default usePDFExport;
