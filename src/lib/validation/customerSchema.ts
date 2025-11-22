import { z } from 'zod'

export const customerSchema = z.object({
  firstName: z.string()
    .trim()
    .min(1, { message: "Le prénom est requis" })
    .max(50, { message: "Le prénom ne doit pas dépasser 50 caractères" }),
  
  lastName: z.string()
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(50, { message: "Le nom ne doit pas dépasser 50 caractères" }),
  
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
    .max(200, { message: "L'adresse ne doit pas dépasser 200 caractères" })
    .optional()
    .or(z.literal('')),
  
  city: z.string()
    .trim()
    .max(100, { message: "La ville ne doit pas dépasser 100 caractères" })
    .optional()
    .or(z.literal('')),
  
  country: z.string()
    .trim()
    .max(100, { message: "Le pays ne doit pas dépasser 100 caractères" })
    .optional()
    .or(z.literal('')),
  
  segment: z.enum(['regular', 'premium', 'vip'], {
    errorMap: () => ({ message: "Le segment doit être 'regular', 'premium' ou 'vip'" })
  }).default('regular'),
})

export type CustomerFormData = z.infer<typeof customerSchema>
