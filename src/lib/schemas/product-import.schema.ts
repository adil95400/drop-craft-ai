import { z } from "zod";

// Schema for CSV product row validation - Flexible pour accepter divers formats
export const ProductImportRowSchema = z.object({
  name: z.string()
    .transform(val => val?.trim() || "")
    .pipe(z.string().min(1, "Le nom est requis").max(500, "Le nom ne peut pas dépasser 500 caractères")),
  
  description: z.string()
    .transform(val => val?.trim() || "")
    .optional()
    .default(""),
  
  price: z.union([
    z.string().transform(val => {
      const cleaned = val?.replace(/[^0-9.,]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned || "0");
      return isNaN(parsed) ? 0 : parsed;
    }),
    z.number()
  ]).pipe(z.number().min(0, "Le prix doit être positif")),
  
  cost_price: z.union([
    z.string().transform(val => {
      if (!val || val.trim() === "") return undefined;
      const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? undefined : parsed;
    }),
    z.number()
  ]).optional(),
  
  sku: z.string()
    .transform(val => val?.trim() || "")
    .pipe(z.string().min(1, "Le SKU est requis").max(100, "Le SKU ne peut pas dépasser 100 caractères")),
  
  category: z.string()
    .transform(val => val?.trim() || "")
    .optional()
    .default(""),
  
  brand: z.string()
    .transform(val => val?.trim() || "")
    .optional()
    .default(""),
  
  stock_quantity: z.union([
    z.string().transform(val => {
      const parsed = parseInt(val?.trim() || "0");
      return isNaN(parsed) ? 0 : parsed;
    }),
    z.number()
  ]).pipe(z.number().int().min(0, "La quantité doit être positive")).optional().default(0),
  
  status: z.string()
    .transform(val => {
      const normalized = val?.toLowerCase().trim();
      if (normalized === "actif" || normalized === "active") return "active";
      if (normalized === "archivé" || normalized === "archived") return "archived";
      return "draft";
    })
    .pipe(z.enum(["draft", "active", "archived"]))
    .optional()
    .default("draft"),
  
  image_url: z.string()
    .transform(val => val?.trim() || "")
    .refine(val => !val || val === "" || val.startsWith("http"), {
      message: "L'URL doit commencer par http ou être vide"
    })
    .optional()
    .default(""),
  
  supplier_name: z.string()
    .transform(val => val?.trim() || "")
    .optional()
    .default(""),
  
  tags: z.string()
    .transform(val => val?.trim() || "")
    .optional()
    .default(""),
  
  weight: z.union([
    z.string().transform(val => {
      if (!val || val.trim() === "") return undefined;
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? undefined : parsed;
    }),
    z.number()
  ]).optional(),
  
  length: z.union([
    z.string().transform(val => {
      if (!val || val.trim() === "") return undefined;
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? undefined : parsed;
    }),
    z.number()
  ]).optional(),
  
  width: z.union([
    z.string().transform(val => {
      if (!val || val.trim() === "") return undefined;
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? undefined : parsed;
    }),
    z.number()
  ]).optional(),
  
  height: z.union([
    z.string().transform(val => {
      if (!val || val.trim() === "") return undefined;
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? undefined : parsed;
    }),
    z.number()
  ]).optional(),
});

export type ProductImportRow = z.infer<typeof ProductImportRowSchema>;

// Schema for CSV import configuration
export const ImportConfigSchema = z.object({
  delimiter: z.enum([",", ";", "\t", "|"]).default(","),
  encoding: z.enum(["utf8", "iso", "windows"]).default("utf8"),
  skipFirstRow: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  ignoreDuplicates: z.boolean().default(true),
  strictValidation: z.boolean().default(true),
  batchSize: z.number().int().min(1).max(1000).default(500),
});

export type ImportConfig = z.infer<typeof ImportConfigSchema>;

// Schema for import result
export const ImportResultSchema = z.object({
  success: z.boolean(),
  totalRows: z.number(),
  successCount: z.number(),
  errorCount: z.number(),
  skippedCount: z.number(),
  errors: z.array(z.object({
    row: z.number(),
    sku: z.string().optional(),
    field: z.string().optional(),
    message: z.string(),
  })),
  duration: z.number(),
  createdIds: z.array(z.string()),
});

export type ImportResult = z.infer<typeof ImportResultSchema>;

// Column mapping for CSV headers
export const PRODUCT_COLUMN_MAPPINGS: Record<string, string[]> = {
  name: ["name", "product_name", "title", "nom", "produit", "titre"],
  description: ["description", "desc", "details", "description_produit"],
  price: ["price", "prix", "selling_price", "prix_vente"],
  cost_price: ["cost_price", "cout", "prix_achat", "cost", "purchase_price"],
  sku: ["sku", "reference", "ref", "product_id", "id_produit"],
  category: ["category", "categorie", "cat", "type"],
  brand: ["brand", "marque", "manufacturer", "fabricant"],
  stock_quantity: ["stock", "quantity", "qty", "quantite", "inventaire", "stock_quantity"],
  status: ["status", "statut", "state", "etat"],
  image_url: ["image", "image_url", "photo", "picture", "img"],
  supplier_name: ["supplier", "fournisseur", "vendor", "supplier_name"],
  tags: ["tags", "etiquettes", "labels", "keywords"],
  weight: ["weight", "poids", "wt"],
  length: ["length", "longueur", "l"],
  width: ["width", "largeur", "w"],
  height: ["height", "hauteur", "h"],
};

// Helper to find matching column
export function findMatchingColumn(
  headers: string[],
  fieldName: keyof typeof PRODUCT_COLUMN_MAPPINGS
): string | undefined {
  const possibleNames = PRODUCT_COLUMN_MAPPINGS[fieldName];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const possibleName of possibleNames) {
    const index = normalizedHeaders.indexOf(possibleName);
    if (index !== -1) {
      return headers[index];
    }
  }
  
  return undefined;
}

// Helper to auto-map CSV columns
export function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  Object.keys(PRODUCT_COLUMN_MAPPINGS).forEach((field) => {
    const matchedColumn = findMatchingColumn(headers, field as keyof typeof PRODUCT_COLUMN_MAPPINGS);
    if (matchedColumn) {
      mapping[field] = matchedColumn;
    }
  });
  
  return mapping;
}
