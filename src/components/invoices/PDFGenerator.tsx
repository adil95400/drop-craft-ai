import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFGeneratorProps {
  invoiceData: {
    invoice_number: string;
    customer_name: string;
    customer_email: string;
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    total_amount: number;
    issued_at: string;
  };
  template?: any;
}

export function PDFGenerator({ invoiceData, template }: PDFGeneratorProps) {
  const { toast } = useToast();

  const generatePDFContent = () => {
    const brandColor = template?.brand_color || '#8B5CF6';
    const logoUrl = template?.logo_url || '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid ${brandColor};
          }
          .company-info {
            flex: 1;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: ${brandColor};
            margin-bottom: 10px;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: ${brandColor};
            margin-bottom: 10px;
          }
          .invoice-number {
            font-size: 14px;
            color: #666;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: ${brandColor};
          }
          .customer-details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background: ${brandColor};
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .totals {
            margin-left: auto;
            width: 300px;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .total-row.grand-total {
            font-size: 20px;
            font-weight: bold;
            color: ${brandColor};
            border-top: 2px solid ${brandColor};
            padding-top: 15px;
            margin-top: 10px;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div class="logo">${template?.company_name || 'ShopOpti'}</div>
            <div>${template?.company_address || '123 Rue du Commerce'}</div>
            <div>${template?.company_city || '75001 Paris, France'}</div>
            <div>${template?.company_phone || '+33 1 23 45 67 89'}</div>
            <div>${template?.company_email || 'contact@shopopti.com'}</div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">FACTURE</div>
            <div class="invoice-number">${invoiceData.invoice_number}</div>
            <div class="invoice-number">Date: ${new Date(invoiceData.issued_at).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Facturé à</div>
          <div class="customer-details">
            <div style="font-weight: 600; margin-bottom: 5px;">${invoiceData.customer_name}</div>
            <div>${invoiceData.customer_email}</div>
          </div>
        </div>

        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Quantité</th>
                <th style="text-align: right;">Prix unitaire</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${item.unit_price.toFixed(2)}€</td>
                  <td style="text-align: right;">${item.total.toFixed(2)}€</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div class="total-row">
            <span>Sous-total:</span>
            <span>${invoiceData.subtotal.toFixed(2)}€</span>
          </div>
          <div class="total-row">
            <span>TVA (20%):</span>
            <span>${invoiceData.tax.toFixed(2)}€</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${invoiceData.total_amount.toFixed(2)}€</span>
          </div>
        </div>

        <div class="footer">
          <p>${template?.footer_text || 'Merci pour votre confiance !'}</p>
          <p style="margin-top: 10px;">
            ${template?.legal_text || 'SIRET: 123 456 789 00012 | TVA: FR12345678901'}
          </p>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = () => {
    const htmlContent = generatePDFContent();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facture-${invoiceData.invoice_number}.html`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: '📄 Facture générée',
      description: 'Le fichier HTML a été téléchargé. Utilisez "Imprimer > Enregistrer au format PDF" dans votre navigateur pour créer un PDF.',
    });
  };

  const handlePreview = () => {
    const htmlContent = generatePDFContent();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handlePreview}>
        <FileText className="h-4 w-4 mr-2" />
        Aperçu
      </Button>
      <Button onClick={handleDownloadPDF} className="bg-gradient-primary">
        <Download className="h-4 w-4 mr-2" />
        Télécharger PDF
      </Button>
    </div>
  );
}
