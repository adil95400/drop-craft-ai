import { useUnifiedStores } from '@/hooks/useUnifiedStores';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Store, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StoreSelectorProps {
  selectedStoreId?: string;
  onStoreChange: (storeId: string) => void;
}

export function StoreSelector({ selectedStoreId, onStoreChange }: StoreSelectorProps) {
  const { stores } = useUnifiedStores();

  if (stores.length === 0) return null;

  return (
    <Select value={selectedStoreId} onValueChange={onStoreChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Sélectionner une boutique" />
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={store.logo_url || undefined} />
                <AvatarFallback className="bg-primary/10">
                  <Store className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{store.name}</span>
              {store.is_active && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
