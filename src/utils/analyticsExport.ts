/**
 * Sprint 10: Analytics Export Utility
 * CSV and PDF export for analytics data
 */
import type { TimeSeriesPoint, CategoryBreakdown, PlatformBreakdown } from '@/hooks/useAdvancedAnalyticsDashboard';

const loadPdfLibs = async () => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  return { jsPDF, autoTable };
};

export function exportTimeSeriesCSV(data: TimeSeriesPoint[], filename = 'analytics-timeseries.csv') {
  const header = 'Date,Revenue,Orders,Avg Order Value\n';
  const rows = data.map(d => `${d.date},${d.revenue},${d.orders},${d.avg_order_value}`).join('\n');
  downloadCSV(header + rows, filename);
}

export function exportCategoryCSV(data: CategoryBreakdown[], filename = 'analytics-categories.csv') {
  const header = 'Category,Revenue,Orders,Products\n';
  const rows = data.map(d => `"${d.category}",${d.revenue},${d.orders},${d.products}`).join('\n');
  downloadCSV(header + rows, filename);
}

export function exportPlatformCSV(data: PlatformBreakdown[], filename = 'analytics-platforms.csv') {
  const header = 'Platform,Revenue,Orders\n';
  const rows = data.map(d => `"${d.platform}",${d.revenue},${d.orders}`).join('\n');
  downloadCSV(header + rows, filename);
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function exportAnalyticsPDF(
  overview: { revenue: number; orders: number; avg_order_value: number },
  timeSeries: TimeSeriesPoint[],
  periodLabel: string
) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('ShopOpti - Rapport Analytics', 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Période : ${periodLabel}`, 14, 30);
  doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 36);

  // Overview
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Vue d\'ensemble', 14, 48);

  autoTable(doc, {
    startY: 52,
    head: [['Métrique', 'Valeur']],
    body: [
      ['Revenus', `${overview.revenue.toFixed(2)} €`],
      ['Commandes', String(overview.orders)],
      ['Panier moyen', `${overview.avg_order_value.toFixed(2)} €`],
    ],
    theme: 'striped',
  });

  // Time series table
  const tableY = (doc as any).lastAutoTable?.finalY || 80;
  doc.setFontSize(14);
  doc.text('Évolution journalière', 14, tableY + 10);

  autoTable(doc, {
    startY: tableY + 14,
    head: [['Date', 'Revenus (€)', 'Commandes', 'Panier moyen (€)']],
    body: timeSeries.slice(-30).map(d => [
      d.date,
      d.revenue.toFixed(2),
      String(d.orders),
      d.avg_order_value.toFixed(2),
    ]),
    theme: 'striped',
    styles: { fontSize: 8 },
  });

  doc.save(`analytics-${periodLabel}.pdf`);
}
