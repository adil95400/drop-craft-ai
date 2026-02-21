import { z } from 'zod'

export const productSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(200, { message: "Le nom ne doit pas dépasser 200 caractères" }),
  
  description: z.string()
    .trim()
    .max(5000, { message: "La description ne doit pas dépasser 5000 caractères" })
    .optional(),
  
  price: z.number()
    .min(0, { message: "Le prix doit être positif" })
    .max(999999.99, { message: "Le prix est trop élevé" }),
  
  cost_price: z.number()
    .min(0, { message: "Le prix de revient doit être positif" })
    .max(999999.99, { message: "Le prix est trop élevé" })
    .optional(),
  
  sku: z.string()
    .trim()
    .max(100, { message: "Le SKU ne doit pas dépasser 100 caractères" })
    .optional(),
  
  category: z.string()
    .trim()
    .max(100, { message: "La catégorie ne doit pas dépasser 100 caractères" })
    .optional(),
  
  stock_quantity: z.number()
    .int({ message: "Le stock doit être un nombre entier" })
    .min(0, { message: "Le stock ne peut pas être négatif" })
    .max(999999, { message: "Le stock est trop élevé" }),
  
  status: z.enum(['active', 'paused', 'draft', 'archived'], {
    errorMap: () => ({ message: "Le statut doit être 'active', 'paused', 'draft' ou 'archived'" })
  }),
  
  image_url: z.string()
    .url({ message: "L'URL de l'image doit être valide" })
    .optional(),
  
  seo_title: z.string()
    .trim()
    .max(70, { message: "Le titre SEO ne doit pas dépasser 70 caractères" })
    .optional(),
  
  seo_description: z.string()
    .trim()
    .max(160, { message: "La description SEO ne doit pas dépasser 160 caractères" })
    .optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

// Schéma pour la validation d'import
export const importProductSchema = productSchema.extend({
  name: z.string()
    .trim()
    .min(1)
    .max(200),
  price: z.number().min(0),
  stock_quantity: z.number().int().min(0).default(0),
  status: z.enum(['active', 'paused', 'draft', 'archived']).default('active'),
})

// Schéma pour l'export
export const exportOptionsSchema = z.object({
  format: z.enum(['csv', 'excel', 'json']),
  includeInactive: z.boolean().default(false),
  includeOutOfStock: z.boolean().default(true),
  fields: z.array(z.string()).optional(),
})

export type ExportOptions = z.infer<typeof exportOptionsSchema>
