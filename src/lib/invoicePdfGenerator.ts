import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InvoiceBranding } from '@/hooks/useInvoiceBranding';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoiceData {
  invoice_number: string;
  date: string;
  due_date: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string;
}

export function generateInvoicePDF(invoice: InvoiceData, branding: InvoiceBranding): jsPDF {
  const doc = new jsPDF();
  const accent = branding.accent_color || '#6366f1';

  // Header bar
  doc.setFillColor(accent);
  doc.rect(0, 0, 210, 8, 'F');

  // Company info
  let y = 20;
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent);
  doc.text(branding.company_name || 'Mon Entreprise', 14, y);

  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#666666');
  if (branding.company_address) { doc.text(branding.company_address, 14, y); y += 4; }
  if (branding.company_email) { doc.text(branding.company_email, 14, y); y += 4; }
  if (branding.company_phone) { doc.text(branding.company_phone, 14, y); y += 4; }
  if (branding.tax_id) { doc.text(`N° TVA: ${branding.tax_id}`, 14, y); y += 4; }

  // Invoice title & number (right side)
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent);
  doc.text('FACTURE', 196, 24, { align: 'right' });

  doc.setFontSize(11);
  doc.setTextColor('#333333');
  doc.text(`${invoice.invoice_number}`, 196, 32, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor('#666666');
  doc.text(`Date: ${invoice.date}`, 196, 38, { align: 'right' });
  doc.text(`Échéance: ${invoice.due_date}`, 196, 43, { align: 'right' });

  // Separator
  y = Math.max(y, 48) + 6;
  doc.setDrawColor(accent);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 10;

  // Customer info box
  doc.setFillColor('#f8f9fa');
  doc.roundedRect(14, y - 2, 90, 30, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor('#999999');
  doc.text('FACTURER À', 18, y + 4);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#333333');
  doc.text(invoice.customer_name || '', 18, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#666666');
  if (invoice.customer_email) doc.text(invoice.customer_email, 18, y + 17);
  if (invoice.customer_address) doc.text(invoice.customer_address, 18, y + 22);

  y += 38;

  // Items table
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qté', 'Prix unit.', 'Total']],
    body: invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${item.unit_price.toFixed(2)} ${branding.currency}`,
      `${item.total.toFixed(2)} ${branding.currency}`,
    ]),
    headStyles: {
      fillColor: accent,
      textColor: '#ffffff',
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: '#333333' },
    alternateRowStyles: { fillColor: '#f8f9fa' },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  let totY = finalY + 8;

  const drawTotalLine = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9);
    doc.setTextColor(bold ? accent : '#666666');
    doc.text(label, 140, totY);
    doc.setTextColor(bold ? '#333333' : '#333333');
    doc.text(value, 196, totY, { align: 'right' });
    totY += bold ? 8 : 6;
  };

  drawTotalLine('Sous-total', `${invoice.subtotal.toFixed(2)} ${branding.currency}`);
  if (invoice.tax_rate > 0) {
    drawTotalLine(`TVA (${invoice.tax_rate}%)`, `${invoice.tax_amount.toFixed(2)} ${branding.currency}`);
  }
  doc.setDrawColor('#dddddd');
  doc.line(140, totY - 2, 196, totY - 2);
  totY += 2;
  drawTotalLine('TOTAL', `${invoice.total.toFixed(2)} ${branding.currency}`, true);

  // Payment terms & notes
  totY += 10;
  if (branding.payment_terms) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#999999');
    doc.text('CONDITIONS DE PAIEMENT', 14, totY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#666666');
    doc.text(branding.payment_terms, 14, totY + 5);
    totY += 12;
  }

  if (branding.bank_details) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#999999');
    doc.text('COORDONNÉES BANCAIRES', 14, totY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#666666');
    const bankLines = doc.splitTextToSize(branding.bank_details, 180);
    doc.text(bankLines, 14, totY + 5);
    totY += 5 + bankLines.length * 4;
  }

  if (invoice.notes) {
    totY += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#999999');
    doc.text('NOTES', 14, totY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#666666');
    doc.text(doc.splitTextToSize(invoice.notes, 180), 14, totY + 5);
  }

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(accent);
  doc.rect(0, pageH - 12, 210, 12, 'F');
  if (branding.footer_text) {
    doc.setFontSize(8);
    doc.setTextColor('#ffffff');
    doc.text(branding.footer_text, 105, pageH - 5, { align: 'center' });
  }

  return doc;
}
