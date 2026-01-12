import { z } from 'zod'

export const orderItemSchema = z.object({
  product_id: z.string().uuid({ message: "ID produit invalide" }).optional(),
  product_name: z.string().min(1, { message: "Nom du produit requis" }),
  sku: z.string().optional(),
  name: z.string().optional(), // Alias for product_name
  quantity: z.number().int().min(1, { message: "Quantité minimum: 1" }).max(9999),
  unit_price: z.number().min(0, { message: "Prix unitaire invalide" }),
  total_price: z.number().min(0),
})

export const shippingAddressSchema = z.object({
  name: z.string().min(1, { message: "Nom requis" }).max(100),
  line1: z.string().min(1, { message: "Adresse requise" }).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, { message: "Ville requise" }).max(100),
  postal_code: z.string().min(1, { message: "Code postal requis" }).max(20),
  country: z.string().min(2, { message: "Pays requis" }).max(2),
  phone: z.string().max(20).optional(),
})

export const orderSchema = z.object({
  customer_id: z.string().uuid({ message: "Client requis" }).optional(),
  customer_email: z.string().email({ message: "Email invalide" }).optional(),
  customer_name: z.string().min(1, { message: "Nom client requis" }).max(100).optional(),
  
  items: z.array(orderItemSchema).min(1, { message: "Au moins un produit requis" }).optional(),
  
  shipping_address: shippingAddressSchema.optional(),
  
  shipping_method: z.string().optional(),
  shipping_cost: z.number().min(0).default(0).optional(),
  
  carrier: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).default('pending'),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
})

export type OrderFormData = z.infer<typeof orderSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type ShippingAddress = z.infer<typeof shippingAddressSchema>

// Schema pour mise à jour de commande
export const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  tracking_number: z.string().max(100).optional(),
  carrier: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
})

export type OrderUpdateData = z.infer<typeof orderUpdateSchema>

// Schema pour export
export const exportConfigSchema = z.object({
  dataType: z.enum(['products', 'orders', 'customers']),
  format: z.enum(['csv', 'xlsx', 'json']),
  columns: z.array(z.string()).min(1, { message: "Sélectionnez au moins une colonne" }),
  filters: z.object({
    status: z.string().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    includeArchived: z.boolean().default(false),
  }).optional(),
})

export type ExportConfig = z.infer<typeof exportConfigSchema>

// Schema pour import
export const importConfigSchema = z.object({
  dataType: z.enum(['products', 'orders', 'customers']),
  mappings: z.record(z.string(), z.string()).optional(),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    validateData: z.boolean().default(true),
  }),
})

export type ImportConfig = z.infer<typeof importConfigSchema>
