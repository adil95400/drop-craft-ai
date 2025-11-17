import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface StoreConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: string
  onConnect: (data: any) => Promise<void>
}

interface FieldConfig {
  name: string
  label: string
  placeholder?: string
  type: 'text' | 'password' | 'switch' | 'select'
  required?: boolean
  options?: string[]
}

interface PlatformConfig {
  name: string
  icon: string
  fields: FieldConfig[]
  schema: z.ZodObject<any>
}

const platformConfigs: Record<string, PlatformConfig> = {
  shopify: {
    name: 'Shopify',
    icon: '🛍️',
    fields: [
      { name: 'name', label: 'Nom de la boutique', placeholder: 'Ma Boutique Shopify', type: 'text', required: true },
      { name: 'domain', label: 'Domaine', placeholder: 'monboutique.myshopify.com', type: 'text', required: true },
      { name: 'accessToken', label: "Token d'accès API", placeholder: 'shpat_xxxxx', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
      { name: 'importProducts', label: 'Importer les produits', type: 'switch' },
      { name: 'trackOrders', label: 'Suivre les commandes', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'Domaine requis'),
      accessToken: z.string().min(1, "Token d'accès requis"),
      autoSync: z.boolean().optional(),
      importProducts: z.boolean().optional(),
      trackOrders: z.boolean().optional(),
    }),
  },
  woocommerce: {
    name: 'WooCommerce',
    icon: '🔌',
    fields: [
      { name: 'name', label: 'Nom de la boutique', placeholder: 'Ma Boutique WooCommerce', type: 'text', required: true },
      { name: 'domain', label: 'URL du site', placeholder: 'https://monsite.com', type: 'text', required: true },
      { name: 'apiKey', label: 'Consumer Key', placeholder: 'ck_xxxxx', type: 'text', required: true },
      { name: 'apiSecret', label: 'Consumer Secret', placeholder: 'cs_xxxxx', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().url('URL invalide').min(1, 'URL requise'),
      apiKey: z.string().min(1, 'Consumer Key requis'),
      apiSecret: z.string().min(1, 'Consumer Secret requis'),
      autoSync: z.boolean().optional(),
    }),
  },
  prestashop: {
    name: 'PrestaShop',
    icon: '🏪',
    fields: [
      { name: 'name', label: 'Nom de la boutique', placeholder: 'Ma Boutique PrestaShop', type: 'text', required: true },
      { name: 'domain', label: 'URL du site', placeholder: 'https://monsite.com', type: 'text', required: true },
      { name: 'apiKey', label: 'Clé Webservice', placeholder: 'XXXXXXXXXXXXX', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().url('URL invalide').min(1, 'URL requise'),
      apiKey: z.string().min(1, 'Clé Webservice requise'),
      autoSync: z.boolean().optional(),
    }),
  },
  magento: {
    name: 'Magento',
    icon: '🧲',
    fields: [
      { name: 'name', label: 'Nom de la boutique', placeholder: 'Ma Boutique Magento', type: 'text', required: true },
      { name: 'domain', label: 'URL du site', placeholder: 'https://monsite.com', type: 'text', required: true },
      { name: 'accessToken', label: "Token d'accès", placeholder: 'Bearer xxxxx', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().url('URL invalide').min(1, 'URL requise'),
      accessToken: z.string().min(1, "Token d'accès requis"),
      autoSync: z.boolean().optional(),
    }),
  },
  bigcommerce: {
    name: 'BigCommerce',
    icon: '🏬',
    fields: [
      { name: 'name', label: 'Nom de la boutique', placeholder: 'Ma Boutique BigCommerce', type: 'text', required: true },
      { name: 'domain', label: 'URL du site', placeholder: 'https://monsite.com', type: 'text', required: true },
      { name: 'storeHash', label: 'Store Hash', placeholder: 'xxxxxx', type: 'text', required: true },
      { name: 'accessToken', label: "Token d'accès", placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().url('URL invalide').min(1, 'URL requise'),
      storeHash: z.string().min(1, 'Store Hash requis'),
      accessToken: z.string().min(1, "Token d'accès requis"),
      autoSync: z.boolean().optional(),
    }),
  },
  amazon: {
    name: 'Amazon',
    icon: '📦',
    fields: [
      { name: 'name', label: 'Nom du compte', placeholder: 'Mon Compte Amazon', type: 'text', required: true },
      { name: 'domain', label: 'Marketplace', placeholder: 'amazon.fr', type: 'text', required: true },
      { name: 'accessToken', label: 'Access Key ID', placeholder: 'AKIA...', type: 'text', required: true },
      { name: 'apiSecret', label: 'Secret Access Key', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'marketplaceId', label: 'Marketplace ID', placeholder: 'ATVPDKIKX0DER', type: 'text' },
      { name: 'environment', label: 'Environnement', type: 'select', options: ['sandbox', 'production'] },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'Marketplace requis'),
      accessToken: z.string().min(1, 'Access Key ID requis'),
      apiSecret: z.string().min(1, 'Secret Access Key requis'),
      marketplaceId: z.string().optional(),
      environment: z.enum(['sandbox', 'production']).optional(),
    }),
  },
  etsy: {
    name: 'Etsy',
    icon: '🎨',
    fields: [
      { name: 'name', label: 'Nom de la boutique', placeholder: 'Ma Boutique Etsy', type: 'text', required: true },
      { name: 'domain', label: 'Shop Name', placeholder: 'MaBoutique', type: 'text', required: true },
      { name: 'apiKey', label: 'API Key (Keystring)', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'accessToken', label: 'OAuth Access Token', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'Shop Name requis'),
      apiKey: z.string().min(1, 'API Key requise'),
      accessToken: z.string().min(1, 'OAuth Access Token requis'),
      autoSync: z.boolean().optional(),
    }),
  },
  ebay: {
    name: 'eBay',
    icon: '🏷️',
    fields: [
      { name: 'name', label: 'Nom du compte', placeholder: 'Mon Compte eBay', type: 'text', required: true },
      { name: 'domain', label: 'Site', placeholder: 'ebay.fr', type: 'text', required: true },
      { name: 'apiKey', label: 'App ID (Client ID)', placeholder: 'xxxxx', type: 'text', required: true },
      { name: 'apiSecret', label: 'Cert ID (Client Secret)', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'accessToken', label: 'OAuth User Token', placeholder: 'v^1.1#...', type: 'password', required: true },
      { name: 'environment', label: 'Environnement', type: 'select', options: ['sandbox', 'production'] },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'Site requis'),
      apiKey: z.string().min(1, 'App ID requis'),
      apiSecret: z.string().min(1, 'Cert ID requis'),
      accessToken: z.string().min(1, 'OAuth User Token requis'),
      environment: z.enum(['sandbox', 'production']).optional(),
    }),
  },
  cdiscount: {
    name: 'Cdiscount',
    icon: '🇫🇷',
    fields: [
      { name: 'name', label: 'Nom du compte', placeholder: 'Mon Compte Cdiscount', type: 'text', required: true },
      { name: 'domain', label: 'Login', placeholder: 'votre-login', type: 'text', required: true },
      { name: 'apiKey', label: 'Clé API', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'accessToken', label: 'Token API', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'Login requis'),
      apiKey: z.string().min(1, 'Clé API requise'),
      accessToken: z.string().min(1, 'Token API requis'),
      autoSync: z.boolean().optional(),
    }),
  },
  wix: {
    name: 'Wix',
    icon: '⚡',
    fields: [
      { name: 'name', label: 'Nom de la boutique', placeholder: 'Ma Boutique Wix', type: 'text', required: true },
      { name: 'domain', label: 'Site ID', placeholder: 'xxxxx-xxxxx', type: 'text', required: true },
      { name: 'accessToken', label: 'API Key', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'Site ID requis'),
      accessToken: z.string().min(1, 'API Key requise'),
      autoSync: z.boolean().optional(),
    }),
  },
  facebook: {
    name: 'Facebook Shop',
    icon: '📘',
    fields: [
      { name: 'name', label: 'Nom de la boutique', placeholder: 'Ma Boutique Facebook', type: 'text', required: true },
      { name: 'domain', label: 'Page ID', placeholder: '1234567890', type: 'text', required: true },
      { name: 'accessToken', label: 'Page Access Token', placeholder: 'EAAxxxx...', type: 'password', required: true },
      { name: 'catalogId', label: 'Catalog ID', placeholder: '1234567890', type: 'text', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'Page ID requis'),
      accessToken: z.string().min(1, 'Page Access Token requis'),
      catalogId: z.string().min(1, 'Catalog ID requis'),
      autoSync: z.boolean().optional(),
    }),
  },
  rakuten: {
    name: 'Rakuten France',
    icon: '🛒',
    fields: [
      { name: 'name', label: 'Nom du compte', placeholder: 'Mon Compte Rakuten', type: 'text', required: true },
      { name: 'domain', label: 'Merchant ID', placeholder: 'xxxxx', type: 'text', required: true },
      { name: 'apiKey', label: 'API Key', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'apiSecret', label: 'API Secret', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'Merchant ID requis'),
      apiKey: z.string().min(1, 'API Key requise'),
      apiSecret: z.string().min(1, 'API Secret requis'),
      autoSync: z.boolean().optional(),
    }),
  },
  fnac: {
    name: 'Fnac Marketplace',
    icon: '📚',
    fields: [
      { name: 'name', label: 'Nom du compte', placeholder: 'Mon Compte Fnac', type: 'text', required: true },
      { name: 'domain', label: 'Partner ID', placeholder: 'xxxxx', type: 'text', required: true },
      { name: 'apiKey', label: 'API Key', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'Partner ID requis'),
      apiKey: z.string().min(1, 'API Key requise'),
      autoSync: z.boolean().optional(),
    }),
  },
  aliexpress: {
    name: 'AliExpress',
    icon: '🌏',
    fields: [
      { name: 'name', label: 'Nom du compte', placeholder: 'Mon Compte AliExpress', type: 'text', required: true },
      { name: 'domain', label: 'App Key', placeholder: 'xxxxx', type: 'text', required: true },
      { name: 'apiKey', label: 'App Key', placeholder: 'xxxxx', type: 'text', required: true },
      { name: 'apiSecret', label: 'App Secret', placeholder: 'xxxxx', type: 'password', required: true },
      { name: 'autoSync', label: 'Synchronisation automatique', type: 'switch' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'App Key requis'),
      apiKey: z.string().min(1, 'App Key requis'),
      apiSecret: z.string().min(1, 'App Secret requis'),
      autoSync: z.boolean().optional(),
    }),
  },
}

export function StoreConnectionDialog({
  open,
  onOpenChange,
  platform,
  onConnect,
}: StoreConnectionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const config = platformConfigs[platform as keyof typeof platformConfigs] || {
    name: platform,
    icon: '🛒',
    fields: [
      { name: 'name', label: 'Nom', placeholder: 'Nom de la boutique', type: 'text', required: true },
      { name: 'domain', label: 'Domaine', placeholder: 'URL ou domaine', type: 'text', required: true },
      { name: 'apiKey', label: 'Clé API', placeholder: 'Entrez votre clé API', type: 'password', required: true },
    ],
    schema: z.object({
      name: z.string().min(1, 'Nom requis'),
      domain: z.string().min(1, 'Domaine requis'),
      apiKey: z.string().min(1, 'Clé API requise'),
    }),
  }

  const defaultValues = config.fields.reduce((acc, field) => {
    if (field.type === 'switch') {
      return { ...acc, [field.name]: true }
    }
    if (field.type === 'select' && field.options) {
      return { ...acc, [field.name]: field.options[0] }
    }
    return { ...acc, [field.name]: '' }
  }, {} as Record<string, any>)

  const form = useForm({
    resolver: zodResolver(config.schema),
    defaultValues,
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      await onConnect({ ...data, platform })
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Connection error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            Connecter {config.name}
          </DialogTitle>
          <DialogDescription>
            Entrez vos identifiants {config.name} pour connecter votre boutique.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {config.fields.map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                      {field.type === 'switch' ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formField.value}
                            onCheckedChange={formField.onChange}
                            disabled={isSubmitting}
                          />
                          <span className="text-sm text-muted-foreground">
                            {formField.value ? 'Activé' : 'Désactivé'}
                          </span>
                        </div>
                      ) : field.type === 'select' && field.options ? (
                        <Select
                          value={formField.value}
                          onValueChange={formField.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          {...formField}
                          type={field.type}
                          placeholder={field.placeholder}
                          disabled={isSubmitting}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connecter
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
