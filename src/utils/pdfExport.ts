import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

const loadPdfLibs = async () => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  return { jsPDF, autoTable };
};

interface ReportData {
  title: string;
  subtitle?: string;
  dateRange?: { start: Date; end: Date };
  summary?: { label: string; value: string | number }[];
  tables?: {
    title: string;
    headers: string[];
    rows: (string | number)[][];
  }[];
  charts?: {
    title: string;
    data: { label: string; value: number }[];
  }[];
}

interface PDFExportOptions {
  includeCharts?: boolean;
  includeTables?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  orientation?: 'portrait' | 'landscape';
}

const COLORS = {
  primary: [123, 97, 255] as [number, number, number],
  secondary: [100, 116, 139] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
};

export async function generatePDFReport(data: ReportData, options: PDFExportOptions = {}) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const {
    includeCharts = true,
    includeTables = true,
    includeSummary = true,
    orientation = 'portrait',
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Header with logo/brand
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Shopopti+', margin, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: getDateFnsLocale() })}`, margin, 30);

  yPos = 50;

  // Report title
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, margin, yPos);
  yPos += 10;

  if (data.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(data.subtitle, margin, yPos);
    yPos += 8;
  }

  if (data.dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.muted);
    const dateRangeText = `Période: ${format(data.dateRange.start, 'dd/MM/yyyy')} - ${format(data.dateRange.end, 'dd/MM/yyyy')}`;
    doc.text(dateRangeText, margin, yPos);
    yPos += 15;
  }

  // Summary section
  if (includeSummary && data.summary && data.summary.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('Résumé Exécutif', margin, yPos);
    yPos += 10;

    const summaryBoxWidth = (pageWidth - 2 * margin - 15) / 4;
    const summaryBoxHeight = 25;

    data.summary.slice(0, 4).forEach((item, index) => {
      const xPos = margin + (index % 4) * (summaryBoxWidth + 5);
      
      // Box background
      doc.setFillColor(...COLORS.background);
      doc.roundedRect(xPos, yPos, summaryBoxWidth, summaryBoxHeight, 3, 3, 'F');

      // Value
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(String(item.value), xPos + 5, yPos + 12);

      // Label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.muted);
      doc.text(item.label, xPos + 5, yPos + 20);
    });

    yPos += summaryBoxHeight + 15;
  }

  // Tables section
  if (includeTables && data.tables && data.tables.length > 0) {
    data.tables.forEach((table) => {
      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(table.title, margin, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [table.headers],
        body: table.rows,
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: COLORS.primary,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: COLORS.text,
        },
        alternateRowStyles: {
          fillColor: COLORS.background,
        },
        styles: {
          cellPadding: 4,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    });
  }

  // Charts section (simplified bar chart representation)
  if (includeCharts && data.charts && data.charts.length > 0) {
    data.charts.forEach((chart) => {
      // Check if we need a new page
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(chart.title, margin, yPos);
      yPos += 10;

      const chartWidth = pageWidth - 2 * margin;
      const chartHeight = 50;
      const maxValue = Math.max(...chart.data.map(d => d.value));
      const barWidth = (chartWidth - 10) / chart.data.length;

      // Chart background
      doc.setFillColor(...COLORS.background);
      doc.roundedRect(margin, yPos, chartWidth, chartHeight, 3, 3, 'F');

      // Draw bars
      chart.data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * (chartHeight - 20);
        const xPos = margin + 5 + index * barWidth;
        const yBarPos = yPos + chartHeight - 15 - barHeight;

        // Bar
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(xPos, yBarPos, barWidth - 5, barHeight, 1, 1, 'F');

        // Label
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.muted);
        const labelText = item.label.substring(0, 6);
        doc.text(labelText, xPos + (barWidth - 5) / 2, yPos + chartHeight - 5, { align: 'center' });
      });

      yPos += chartHeight + 15;
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `Page ${i} sur ${totalPages} | Shopopti+ - Rapport confidentiel`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc;
}

export async function downloadPDFReport(data: ReportData, options: PDFExportOptions = {}, filename?: string): Promise<void> {
  const doc = await generatePDFReport(data, options);
  const defaultFilename = `rapport-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(filename || defaultFilename);
}

export function generateSalesReport(salesData: any[], dateRange: { start: Date; end: Date }): ReportData {
  const totalRevenue = salesData.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const totalOrders = salesData.reduce((sum, s) => sum + (s.orders || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    title: 'Rapport des Ventes',
    subtitle: 'Analyse détaillée de vos performances commerciales',
    dateRange,
    summary: [
      { label: 'Chiffre d\'affaires', value: `${totalRevenue.toLocaleString('fr-FR')} €` },
      { label: 'Commandes', value: totalOrders.toLocaleString('fr-FR') },
      { label: 'Panier moyen', value: `${avgOrderValue.toFixed(2)} €` },
      { label: 'Taux de conversion', value: '3.2%' },
    ],
    tables: [
      {
        title: 'Détail des ventes par jour',
        headers: ['Date', 'Commandes', 'Chiffre d\'affaires', 'Panier moyen'],
        rows: salesData.slice(0, 10).map(s => [
          s.date || 'N/A',
          String(s.orders || 0),
          `${(s.revenue || 0).toLocaleString('fr-FR')} €`,
          `${((s.revenue || 0) / Math.max(s.orders || 1, 1)).toFixed(2)} €`,
        ]),
      },
    ],
    charts: [
      {
        title: 'Évolution du chiffre d\'affaires',
        data: salesData.slice(0, 7).map(s => ({
          label: s.date?.substring(5) || 'N/A',
          value: s.revenue || 0,
        })),
      },
    ],
  };
}

export function generateInventoryReport(products: any[]): ReportData {
  const totalProducts = products.length;
  const lowStock = products.filter(p => (p.stock || 0) < 10).length;
  const outOfStock = products.filter(p => (p.stock || 0) === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);

  return {
    title: 'État des Stocks',
    subtitle: 'Vue d\'ensemble des niveaux de stock actuels',
    dateRange: { start: new Date(), end: new Date() },
    summary: [
      { label: 'Total produits', value: totalProducts },
      { label: 'Stock faible', value: lowStock },
      { label: 'Rupture', value: outOfStock },
      { label: 'Valeur stock', value: `${totalValue.toLocaleString('fr-FR')} €` },
    ],
    tables: [
      {
        title: 'Produits en stock faible',
        headers: ['Produit', 'SKU', 'Stock', 'Seuil d\'alerte', 'Prix'],
        rows: products
          .filter(p => (p.stock || 0) < 10)
          .slice(0, 15)
          .map(p => [
            p.title?.substring(0, 30) || 'N/A',
            p.sku || 'N/A',
            String(p.stock || 0),
            String(p.low_stock_threshold || 10),
            `${(p.price || 0).toFixed(2)} €`,
          ]),
      },
    ],
  };
}

export function generateCustomersReport(customers: any[]): ReportData {
  const totalCustomers = customers.length;
  const newCustomers = customers.filter(c => {
    const createdAt = new Date(c.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdAt > thirtyDaysAgo;
  }).length;
  const totalValue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const avgValue = totalCustomers > 0 ? totalValue / totalCustomers : 0;

  return {
    title: 'Analyse Clientèle',
    subtitle: 'Segmentation et comportement des clients',
    dateRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
    summary: [
      { label: 'Total clients', value: totalCustomers },
      { label: 'Nouveaux (30j)', value: newCustomers },
      { label: 'LTV moyen', value: `${avgValue.toFixed(2)} €` },
      { label: 'Valeur totale', value: `${totalValue.toLocaleString('fr-FR')} €` },
    ],
    tables: [
      {
        title: 'Meilleurs clients',
        headers: ['Client', 'Email', 'Commandes', 'Total dépensé'],
        rows: customers
          .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
          .slice(0, 10)
          .map(c => [
            c.name || 'Anonyme',
            c.email || 'N/A',
            String(c.orders_count || 0),
            `${(c.total_spent || 0).toLocaleString('fr-FR')} €`,
          ]),
      },
    ],
  };
}

export function generateOrdersReport(orders: any[]): ReportData {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  return {
    title: 'Performance des Commandes',
    subtitle: 'Métriques de traitement et livraison',
    dateRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
    summary: [
      { label: 'Total commandes', value: totalOrders },
      { label: 'En attente', value: pendingOrders },
      { label: 'Expédiées', value: shippedOrders },
      { label: 'Livrées', value: deliveredOrders },
    ],
    tables: [
      {
        title: 'Dernières commandes',
        headers: ['N° Commande', 'Client', 'Date', 'Statut', 'Total'],
        rows: orders.slice(0, 15).map(o => [
          o.order_number || 'N/A',
          o.customer_name || 'Anonyme',
          o.created_at ? format(new Date(o.created_at), 'dd/MM/yyyy') : 'N/A',
          o.status || 'N/A',
          `${(o.total || 0).toFixed(2)} €`,
        ]),
      },
    ],
    charts: [
      {
        title: 'Répartition des statuts',
        data: [
          { label: 'Attente', value: pendingOrders },
          { label: 'Expéd.', value: shippedOrders },
          { label: 'Livrées', value: deliveredOrders },
        ],
      },
    ],
  };
}
