const loadXLSX = () => import('xlsx');

export type ExportFormat = 'csv' | 'json' | 'excel';

export class DataExportService {
  static async exportToCSV(data: any[], filename: string): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          const value = row[h];
          // Échapper les virgules et guillemets
          if (value === null || value === undefined) return '';
          const str = String(value);
          return str.includes(',') || str.includes('"') 
            ? `"${str.replace(/"/g, '""')}"` 
            : str;
        }).join(',')
      )
    ].join('\n');

    this.downloadFile(
      new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), // UTF-8 BOM
      filename
    );
  }

  static async exportToJSON(data: any[], filename: string): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }

    const json = JSON.stringify(data, null, 2);
    this.downloadFile(
      new Blob([json], { type: 'application/json' }),
      filename
    );
  }

  static async exportToExcel(data: any[], filename: string, sheetName: string = 'Data'): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }

    const XLSX = await loadXLSX();
    const ws = XLSX.utils.json_to_sheet(data);
    
    const cols = Object.keys(data[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
    }));
    ws['!cols'] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.downloadFile(
      new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      }),
      filename
    );
  }

  static async exportData(
    data: any[], 
    format: ExportFormat, 
    baseFilename: string = 'export'
  ): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'csv':
        await this.exportToCSV(data, `${baseFilename}-${timestamp}.csv`);
        break;
      case 'json':
        await this.exportToJSON(data, `${baseFilename}-${timestamp}.json`);
        break;
      case 'excel':
        await this.exportToExcel(data, `${baseFilename}-${timestamp}.xlsx`);
        break;
      default:
        throw new Error(`Format non supporté: ${format}`);
    }
  }

  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static generateTemplate(): void {
    const template = [
      {
        name: 'Exemple Produit',
        sku: 'PROD-001',
        price: 99.99,
        cost_price: 50.00,
        stock: 100,
        category: 'Électronique',
        description: 'Description du produit',
        image_url: 'https://example.com/image.jpg'
      }
    ];

    this.exportToCSV(template, 'template-produits.csv');
  }
}
