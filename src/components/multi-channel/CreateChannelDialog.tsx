import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSalesChannel } from '@/hooks/useMultiChannel';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  channel_type: z.enum(['shopify', 'amazon', 'ebay', 'woocommerce', 'prestashop', 'custom']),
  auto_sync: z.boolean().default(true),
  sync_interval_minutes: z.number().min(15).max(1440).default(60),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChannelDialog({ open, onOpenChange }: CreateChannelDialogProps) {
  const createChannel = useCreateSalesChannel();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      channel_type: 'shopify',
      auto_sync: true,
      sync_interval_minutes: 60,
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createChannel.mutateAsync({
      name: values.name,
      channel_type: values.channel_type,
      sync_config: {
        auto_sync: values.auto_sync,
        sync_interval_minutes: values.sync_interval_minutes,
      },
      status: 'inactive',
    });
    form.reset();
    onOpenChange(false);
  };

  const channelOptions = [
    { value: 'shopify', label: 'Shopify', icon: '🛒' },
    { value: 'amazon', label: 'Amazon', icon: '📦' },
    { value: 'ebay', label: 'eBay', icon: '🏷️' },
    { value: 'woocommerce', label: 'WooCommerce', icon: '🔧' },
    { value: 'prestashop', label: 'PrestaShop', icon: '🛍️' },
    { value: 'custom', label: 'API Personnalisée', icon: '⚙️' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un canal de vente</DialogTitle>
          <DialogDescription>
            Connectez un nouveau canal pour synchroniser vos produits
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du canal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ma boutique Shopify" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="channel_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de plateforme</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {channelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="auto_sync"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Synchronisation automatique</FormLabel>
                    <FormDescription>
                      Synchroniser automatiquement les produits
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('auto_sync') && (
              <FormField
                control={form.control}
                name="sync_interval_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intervalle de synchronisation (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={15} 
                        max={1440}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Entre 15 minutes et 24 heures
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createChannel.isPending}>
                {createChannel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ajouter le canal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
