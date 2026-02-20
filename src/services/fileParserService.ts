import { z } from 'zod';

const loadXLSX = () => import('xlsx');

// Schema de validation pour les produits importés
export const ProductImportSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200),
  sku: z.string().max(100).optional().nullable(),
  price: z.number().min(0, 'Le prix doit être positif'),
  cost_price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  category: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().url().max(500).optional().nullable(),
});

export type ProductImport = z.infer<typeof ProductImportSchema>;

interface ParseResult {
  data: any[];
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

export class FileParserService {
  static async parseCSV(text: string, delimiter: string = ',', skipRows: number = 1): Promise<ParseResult> {
    const errors: Array<{ row: number; error: string }> = [];
    const warnings: Array<{ row: number; warning: string }> = [];
    const data: any[] = [];

    try {
      const rows = text.split('\n').filter(r => r.trim());
      if (rows.length < 2) {
        throw new Error('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
      }

      const headers = rows[0].split(delimiter).map(h => h.trim());
      
      for (let i = skipRows; i < rows.length; i++) {
        try {
          const values = rows[i].split(delimiter);
          const row = headers.reduce((obj, header, idx) => {
            obj[header] = values[idx]?.trim() || '';
            return obj;
          }, {} as any);

          data.push(this.normalizeProduct(row));
        } catch (error) {
          errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Erreur de parsing'
          });
        }
      }
    } catch (error) {
      throw new Error(`Erreur lors du parsing CSV: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    return { data, errors, warnings };
  }

  static async parseJSON(text: string): Promise<ParseResult> {
    const errors: Array<{ row: number; error: string }> = [];
    const warnings: Array<{ row: number; warning: string }> = [];
    const data: any[] = [];

    try {
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      items.forEach((item, index) => {
        try {
          data.push(this.normalizeProduct(item));
        } catch (error) {
          errors.push({
            row: index + 1,
            error: error instanceof Error ? error.message : 'Erreur de parsing'
          });
        }
      });
    } catch (error) {
      throw new Error(`Erreur lors du parsing JSON: ${error instanceof Error ? error.message : 'JSON invalide'}`);
    }

    return { data, errors, warnings };
  }

  static async parseExcel(arrayBuffer: ArrayBuffer): Promise<ParseResult> {
    const errors: Array<{ row: number; error: string }> = [];
    const warnings: Array<{ row: number; warning: string }> = [];
    const data: any[] = [];

    try {
      const XLSX = await loadXLSX();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(firstSheet);

      rawData.forEach((item, index) => {
        try {
          data.push(this.normalizeProduct(item));
        } catch (error) {
          errors.push({
            row: index + 2, // +2 car Excel commence à 1 et il y a l'en-tête
            error: error instanceof Error ? error.message : 'Erreur de parsing'
          });
        }
      });
    } catch (error) {
      throw new Error(`Erreur lors du parsing Excel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    return { data, errors, warnings };
  }

  private static normalizeProduct(raw: any): ProductImport {
    // Normalisation des noms de colonnes (support Shopify français et anglais)
    const normalized = {
      name: raw.name || raw.title || raw.nom || raw.Title || raw.Nom || raw.Handle || '',
      sku: raw.sku || raw.SKU || raw.reference || raw.Référence || raw.ref || raw.Variant_SKU || null,
      price: this.parseNumber(raw.price || raw.prix || raw.Price || raw.Prix || raw.Variant_Price || 0),
      cost_price: this.parseNumber(raw.cost_price || raw.cost || raw.cout || raw['Prix de revient'] || raw.Variant_Compare_At_Price || 0),
      stock: this.parseInt(raw.stock || raw.quantity || raw.quantite || raw.Quantity || raw.Inventaire || raw.Variant_Inventory_Qty || 0),
      category: raw.category || raw.categorie || raw.Type || raw.type || raw.Product_Type || null,
      description: raw.description || raw.Description || raw['Body HTML'] || raw.Body_HTML || null,
      image_url: raw.image_url || raw.image || raw.Image || raw.photo || raw['Image Src'] || raw.Image_Src || null,
    };

    // Validation avec zod
    return ProductImportSchema.parse(normalized);
  }

  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }

  private static parseInt(value: any): number {
    if (typeof value === 'number') return Math.floor(value);
    const parsed = parseInt(String(value).replace(/[^0-9-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
}
