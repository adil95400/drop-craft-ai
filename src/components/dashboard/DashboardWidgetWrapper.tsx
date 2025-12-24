import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GripVertical, MoreVertical, Eye, EyeOff, Settings, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { DashboardWidgetConfig, useDashboardConfig, WidgetSize } from '@/hooks/useDashboardConfig';
import { cn } from '@/lib/utils';

interface DashboardWidgetWrapperProps {
  widget: DashboardWidgetConfig;
  isCustomizing: boolean;
  children: React.ReactNode;
}

export function DashboardWidgetWrapper({ widget, isCustomizing, children }: DashboardWidgetWrapperProps) {
  const { toggleWidget, updateWidget, removeWidget } = useDashboardConfig();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isCustomizing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleResize = (newSize: WidgetSize) => {
    updateWidget(widget.id, { size: newSize });
  };

  const sizes: WidgetSize[] = ['sm', 'md', 'lg', 'xl'];
  const currentSizeIndex = sizes.indexOf(widget.size);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group h-full',
        isDragging && 'opacity-50 z-50',
        isCustomizing && 'ring-2 ring-primary/30 ring-offset-2 rounded-lg'
      )}
    >
      {/* Drag Handle */}
      {isCustomizing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 px-2 py-1 bg-primary text-primary-foreground rounded-md cursor-grab active:cursor-grabbing shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
        >
          <GripVertical className="h-3 w-3" />
          <span className="text-xs font-medium">{widget.title}</span>
        </div>
      )}

      {/* Widget Menu */}
      {isCustomizing && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleWidget(widget.id)}>
                {widget.enabled ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Masquer
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Afficher
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                disabled={currentSizeIndex >= sizes.length - 1}
                onClick={() => handleResize(sizes[currentSizeIndex + 1])}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Agrandir
              </DropdownMenuItem>
              
              <DropdownMenuItem
                disabled={currentSizeIndex <= 0}
                onClick={() => handleResize(sizes[currentSizeIndex - 1])}
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                Réduire
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => removeWidget(widget.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <Card className={cn(
        'h-full overflow-hidden transition-all',
        isCustomizing && 'hover:shadow-lg',
        isDragging && 'shadow-2xl'
      )}>
        {children}
      </Card>
    </div>
  );
}
