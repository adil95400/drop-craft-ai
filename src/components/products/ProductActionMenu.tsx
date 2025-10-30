import { useState } from 'react'
import { MoreHorizontal, Sparkles, Store, ShoppingBag, Share2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ProductOptimizeDialog } from './ProductOptimizeDialog'
import { ProductPublishDialog } from './ProductPublishDialog'

interface ProductActionMenuProps {
  product: any
}

export function ProductActionMenu({ product }: ProductActionMenuProps) {
  const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-muted transition-all duration-200"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setOptimizeDialogOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span>Optimiser avec l'IA</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setPublishDialogOpen(true)}>
            <Store className="mr-2 h-4 w-4 text-info" />
            <span>Publier</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProductOptimizeDialog
        open={optimizeDialogOpen}
        onOpenChange={setOptimizeDialogOpen}
        product={product}
      />

      <ProductPublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        product={product}
      />
    </>
  )
}
