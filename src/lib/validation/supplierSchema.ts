import { z } from 'zod'

export const supplierSchema = z.object({
  companyName: z.string()
    .trim()
    .min(1, { message: "Le nom de l'entreprise est requis" })
    .max(200, { message: "Le nom ne doit pas dépasser 200 caractères" }),
  
  contactName: z.string()
    .trim()
    .min(1, { message: "Le nom du contact est requis" })
    .max(100, { message: "Le nom ne doit pas dépasser 100 caractères" }),
  
  email: z.string()
    .trim()
    .email({ message: "Email invalide" })
    .max(255, { message: "L'email ne doit pas dépasser 255 caractères" }),
  
  phone: z.string()
    .trim()
    .max(20, { message: "Le téléphone ne doit pas dépasser 20 caractères" })
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .trim()
    .max(300, { message: "L'adresse ne doit pas dépasser 300 caractères" })
    .optional()
    .or(z.literal('')),
  
  city: z.string()
    .trim()
    .max(100, { message: "La ville ne doit pas dépasser 100 caractères" })
    .optional()
    .or(z.literal('')),
  
  postalCode: z.string()
    .trim()
    .max(20, { message: "Le code postal ne doit pas dépasser 20 caractères" })
    .optional()
    .or(z.literal('')),
  
  country: z.string()
    .trim()
    .max(100, { message: "Le pays ne doit pas dépasser 100 caractères" })
    .optional()
    .or(z.literal('')),
  
  website: z.string()
    .trim()
    .url({ message: "URL invalide" })
    .max(500, { message: "L'URL ne doit pas dépasser 500 caractères" })
    .optional()
    .or(z.literal('')),
  
  taxId: z.string()
    .trim()
    .max(50, { message: "Le numéro de TVA ne doit pas dépasser 50 caractères" })
    .optional()
    .or(z.literal('')),
  
  category: z.enum(['electronics', 'clothing', 'food', 'beauty', 'home', 'services', 'other'])
    .optional(),
  
  paymentTerms: z.enum(['immediate', 'net15', 'net30', 'net60', 'prepayment'])
    .optional(),
  
  deliveryTime: z.number()
    .int({ message: "Le délai doit être un nombre entier" })
    .min(0, { message: "Le délai ne peut pas être négatif" })
    .max(365, { message: "Le délai ne doit pas dépasser 365 jours" })
    .optional(),
  
  minimumOrder: z.number()
    .min(0, { message: "Le montant minimum ne peut pas être négatif" })
    .max(999999.99, { message: "Le montant est trop élevé" })
    .optional(),
  
  notes: z.string()
    .trim()
    .max(2000, { message: "Les notes ne doivent pas dépasser 2000 caractères" })
    .optional()
    .or(z.literal('')),
  
  isActive: z.boolean().default(true),
  
  isPreferred: z.boolean().default(false),
})

export type SupplierFormData = z.infer<typeof supplierSchema>
