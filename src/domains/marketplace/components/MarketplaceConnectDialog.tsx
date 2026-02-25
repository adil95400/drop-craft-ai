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
import { Loader2 } from 'lucide-react'

interface MarketplaceConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: string
  onConnect: (credentials: any) => Promise<void>
}

const platformConfigs = {
  shopify: {
    name: 'Shopify',
    fields: [
      { name: 'shop_url', label: 'URL de la boutique', placeholder: 'monboutique.myshopify.com', type: 'text' },
      { name: 'access_token', label: "Token d'accès", placeholder: 'shpat_xxxxx', type: 'password' },
    ],
    schema: z.object({
      shop_url: z.string().min(1, 'URL requise'),
      access_token: z.string().min(1, "Token d'accès requis"),
    }),
  },
  woocommerce: {
    name: 'WooCommerce',
    fields: [
      { name: 'shop_url', label: 'URL de la boutique', placeholder: 'https://monsite.com', type: 'text' },
      { name: 'api_key', label: 'Clé API (Consumer Key)', placeholder: 'ck_xxxxx', type: 'text' },
      { name: 'api_secret', label: 'Secret API (Consumer Secret)', placeholder: 'cs_xxxxx', type: 'password' },
    ],
    schema: z.object({
      shop_url: z.string().url('URL invalide').min(1, 'URL requise'),
      api_key: z.string().min(1, 'Clé API requise'),
      api_secret: z.string().min(1, 'Secret API requis'),
    }),
  },
  etsy: {
    name: 'Etsy',
    fields: [
      { name: 'api_key', label: 'Clé API', placeholder: 'xxxxx', type: 'password' },
      { name: 'shop_id', label: 'ID de la boutique', placeholder: '12345678', type: 'text' },
    ],
    schema: z.object({
      api_key: z.string().min(1, 'Clé API requise'),
      shop_id: z.string().min(1, 'ID de boutique requis'),
    }),
  },
  amazon: {
    name: 'Amazon',
    fields: [
      { name: 'api_key', label: 'Access Key ID', placeholder: 'AKIA...', type: 'text' },
      { name: 'api_secret', label: 'Secret Access Key', placeholder: 'xxxxx', type: 'password' },
      { name: 'seller_id', label: 'Seller ID', placeholder: 'A...', type: 'text' },
      { name: 'marketplace_id', label: 'Marketplace ID', placeholder: 'ATVPDKIKX0DER', type: 'text' },
    ],
    schema: z.object({
      api_key: z.string().min(1, 'Access Key ID requis'),
      api_secret: z.string().min(1, 'Secret Access Key requis'),
      seller_id: z.string().min(1, 'Seller ID requis'),
      marketplace_id: z.string().min(1, 'Marketplace ID requis'),
    }),
  },
  ebay: {
    name: 'eBay',
    fields: [
      { name: 'api_key', label: 'App ID (Client ID)', placeholder: 'xxxxx', type: 'text' },
      { name: 'api_secret', label: 'Cert ID (Client Secret)', placeholder: 'xxxxx', type: 'password' },
      { name: 'oauth_token', label: 'OAuth User Token', placeholder: 'v^1.1#...', type: 'password' },
    ],
    schema: z.object({
      api_key: z.string().min(1, 'App ID requis'),
      api_secret: z.string().min(1, 'Cert ID requis'),
      oauth_token: z.string().min(1, 'OAuth Token requis'),
    }),
  },
  cdiscount: {
    name: 'Cdiscount',
    fields: [
      { name: 'api_key', label: 'Clé API', placeholder: 'xxxxx', type: 'password' },
      { name: 'login', label: 'Login', placeholder: 'votre-login', type: 'text' },
    ],
    schema: z.object({
      api_key: z.string().min(1, 'Clé API requise'),
      login: z.string().min(1, 'Login requis'),
    }),
  },
  allegro: {
    name: 'Allegro',
    fields: [
      { name: 'api_key', label: 'Client ID', placeholder: 'xxxxx', type: 'text' },
      { name: 'access_token', label: 'Client Secret', placeholder: 'xxxxx', type: 'password' },
    ],
    schema: z.object({
      api_key: z.string().min(1, 'Client ID requis'),
      access_token: z.string().min(1, 'Client Secret requis'),
    }),
  },
  manomano: {
    name: 'ManoMano',
    fields: [
      { name: 'api_key', label: 'Clé API', placeholder: 'xxxxx', type: 'password' },
      { name: 'shop_id', label: 'ID de la boutique', placeholder: '12345', type: 'text' },
    ],
    schema: z.object({
      api_key: z.string().min(1, 'Clé API requise'),
      shop_id: z.string().min(1, 'ID de boutique requis'),
    }),
  },
  tiktok: {
    name: 'TikTok Shop',
    fields: [
      { name: 'app_key', label: 'App Key', placeholder: 'xxxxx', type: 'text' },
      { name: 'app_secret', label: 'App Secret', placeholder: 'xxxxx', type: 'password' },
      { name: 'shop_id', label: 'Shop ID', placeholder: '12345', type: 'text' },
    ],
    schema: z.object({
      app_key: z.string().min(1, 'App Key requis'),
      app_secret: z.string().min(1, 'App Secret requis'),
      shop_id: z.string().min(1, 'Shop ID requis'),
    }),
  },
}

export function MarketplaceConnectDialog({
  open,
  onOpenChange,
  platform,
  onConnect,
}: MarketplaceConnectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const config = platformConfigs[platform as keyof typeof platformConfigs] || {
    name: platform,
    fields: [
      { name: 'api_key', label: 'Clé API', placeholder: 'Entrez votre clé API', type: 'password' },
    ],
    schema: z.object({
      api_key: z.string().min(1, 'Clé API requise'),
    }),
  }

  const form = useForm({
    resolver: zodResolver(config.schema),
    defaultValues: config.fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {} as Record<string, string>),
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      await onConnect(data)
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connecter {config.name}</DialogTitle>
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
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      <Input
                        {...formField}
                        type={field.type}
                        placeholder={field.placeholder}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <DialogFooter>
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
