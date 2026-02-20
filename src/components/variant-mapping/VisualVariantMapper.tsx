/**
 * VisualVariantMapper — Drag & Drop variant mapping interface
 * Connects supplier variants to store variants visually (like DSers)
 */
import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  ArrowRight, Link2, Unlink, Palette, Ruler, Package,
  Search, Wand2, CheckCircle, X, GripVertical, Trash2,
  Save, RotateCcw, Zap
} from 'lucide-react';
import { useVariantMappings, useCreateVariantMapping, useCreateBulkMappings, useDeleteVariantMapping } from '@/hooks/useVariantMapping';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ===== Types =====
interface VariantItem {
  id: string;
  optionName: string;
  optionValue: string;
  sku?: string;
  supplierName?: string;
}

interface MappingConnection {
  id: string;
  sourceId: string;
  targetId: string;
  source: VariantItem;
  target: VariantItem;
  isNew?: boolean;
}

// ===== Draggable Variant Card =====
function DraggableVariant({ item, side, isMapped }: { item: VariantItem; side: 'source' | 'target'; isMapped: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${side}-${item.id}`,
    data: { item, side },
    disabled: side === 'target', // only source items are draggable
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const typeIcon = item.optionName.toLowerCase().includes('coul') || item.optionName.toLowerCase().includes('color')
    ? <Palette className="h-3.5 w-3.5" />
    : item.optionName.toLowerCase().includes('taill') || item.optionName.toLowerCase().includes('size')
      ? <Ruler className="h-3.5 w-3.5" />
      : <Package className="h-3.5 w-3.5" />;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(side === 'source' ? { ...listeners, ...attributes } : {})}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-lg border transition-all",
        "hover:border-primary/50 hover:shadow-sm",
        isDragging && "opacity-50 scale-95 border-dashed border-primary",
        isMapped
          ? "bg-green-500/5 border-green-500/30 dark:bg-green-500/10"
          : "bg-card border-border",
        side === 'source' && "cursor-grab active:cursor-grabbing"
      )}
    >
      {side === 'source' && (
        <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
      )}
      <span className="text-muted-foreground flex-shrink-0">{typeIcon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.optionValue}</p>
        <p className="text-xs text-muted-foreground truncate">{item.optionName}{item.sku ? ` · ${item.sku}` : ''}</p>
      </div>
      {isMapped && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
    </div>
  );
}

// ===== Droppable Target Zone =====
function DroppableTarget({ item, children }: { item: VariantItem; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `target-${item.id}`,
    data: { item, side: 'target' },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all rounded-lg",
        isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]"
      )}
    >
      {children}
    </div>
  );
}

// ===== Connection Line =====
function ConnectionLine({ connection, onRemove }: { connection: MappingConnection; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
        connection.isNew
          ? "bg-primary/5 border-primary/30"
          : "bg-muted/50 border-border"
      )}
    >
      <Badge variant="outline" className="text-xs font-normal max-w-[120px] truncate">
        {connection.source.optionValue}
      </Badge>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <Badge variant="outline" className="text-xs font-normal max-w-[120px] truncate">
        {connection.target.optionValue}
      </Badge>
      {connection.isNew && (
        <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">Nouveau</Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 ml-auto flex-shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </motion.div>
  );
}

// ===== Main Component =====
export function VisualVariantMapper() {
  const { data: existingMappings = [], isLoading } = useVariantMappings();
  const createMutation = useCreateVariantMapping();
  const bulkCreateMutation = useCreateBulkMappings();
  const deleteMutation = useDeleteVariantMapping();

  const [connections, setConnections] = useState<MappingConnection[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Build variant items from existing mappings
  const { sourceItems, targetItems } = useMemo(() => {
    const sources = new Map<string, VariantItem>();
    const targets = new Map<string, VariantItem>();

    existingMappings.forEach((m) => {
      const srcKey = `${m.source_option_name}::${m.source_option_value}`;
      const tgtKey = `${m.target_option_name}::${m.target_option_value}`;

      if (!sources.has(srcKey)) {
        sources.set(srcKey, {
          id: srcKey,
          optionName: m.source_option_name,
          optionValue: m.source_option_value,
          sku: m.source_sku || undefined,
        });
      }
      if (!targets.has(tgtKey)) {
        targets.set(tgtKey, {
          id: tgtKey,
          optionName: m.target_option_name,
          optionValue: m.target_option_value,
        });
      }
    });

    // Add demo items if empty
    if (sources.size === 0) {
      const demoSources: VariantItem[] = [
        { id: 'color::Red', optionName: 'Color', optionValue: 'Red' },
        { id: 'color::Blue', optionName: 'Color', optionValue: 'Blue' },
        { id: 'color::Black', optionName: 'Color', optionValue: 'Black' },
        { id: 'size::S', optionName: 'Size', optionValue: 'S' },
        { id: 'size::M', optionName: 'Size', optionValue: 'M' },
        { id: 'size::L', optionName: 'Size', optionValue: 'L' },
        { id: 'size::XL', optionName: 'Size', optionValue: 'XL' },
      ];
      const demoTargets: VariantItem[] = [
        { id: 'couleur::Rouge', optionName: 'Couleur', optionValue: 'Rouge' },
        { id: 'couleur::Bleu', optionName: 'Couleur', optionValue: 'Bleu' },
        { id: 'couleur::Noir', optionName: 'Couleur', optionValue: 'Noir' },
        { id: 'taille::S', optionName: 'Taille', optionValue: 'S' },
        { id: 'taille::M', optionName: 'Taille', optionValue: 'M' },
        { id: 'taille::L', optionName: 'Taille', optionValue: 'L' },
        { id: 'taille::XL', optionName: 'Taille', optionValue: 'XL' },
      ];
      demoSources.forEach(s => sources.set(s.id, s));
      demoTargets.forEach(t => targets.set(t.id, t));
    }

    return {
      sourceItems: Array.from(sources.values()),
      targetItems: Array.from(targets.values()),
    };
  }, [existingMappings]);

  // Filter items
  const filteredSources = useMemo(() => 
    sourceItems.filter(s => {
      const matchSearch = s.optionValue.toLowerCase().includes(searchSource.toLowerCase());
      const matchType = filterType === 'all' || s.optionName.toLowerCase() === filterType.toLowerCase();
      return matchSearch && matchType;
    }), [sourceItems, searchSource, filterType]);

  const filteredTargets = useMemo(() =>
    targetItems.filter(t => t.optionValue.toLowerCase().includes(searchTarget.toLowerCase())),
    [targetItems, searchTarget]);

  // Track which items are mapped
  const mappedSourceIds = useMemo(() => new Set(connections.map(c => c.sourceId)), [connections]);
  const mappedTargetIds = useMemo(() => new Set(connections.map(c => c.targetId)), [connections]);

  // Option types for filter
  const optionTypes = useMemo(() => 
    [...new Set(sourceItems.map(s => s.optionName))], [sourceItems]);

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const sourceData = active.data.current as { item: VariantItem; side: string };
    const targetData = over.data.current as { item: VariantItem; side: string } | undefined;

    if (!sourceData || !targetData || sourceData.side !== 'source' || targetData.side !== 'target') return;

    const sourceItem = sourceData.item;
    const targetItem = targetData.item;

    // Check if connection already exists
    const exists = connections.some(
      c => c.sourceId === sourceItem.id && c.targetId === targetItem.id
    );
    if (exists) return;

    // Remove previous mapping for this source if exists
    setConnections(prev => {
      const filtered = prev.filter(c => c.sourceId !== sourceItem.id);
      return [
        ...filtered,
        {
          id: `${sourceItem.id}→${targetItem.id}`,
          sourceId: sourceItem.id,
          targetId: targetItem.id,
          source: sourceItem,
          target: targetItem,
          isNew: true,
        },
      ];
    });
  }, [connections]);

  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  }, []);

  // Auto-map by matching names
  const handleAutoMap = useCallback(() => {
    const newConnections: MappingConnection[] = [];

    sourceItems.forEach(source => {
      const normalizedSource = source.optionValue.toLowerCase().trim();
      
      // Try exact match first
      let match = targetItems.find(t => 
        t.optionValue.toLowerCase().trim() === normalizedSource &&
        !newConnections.some(c => c.targetId === t.id)
      );

      // Try partial match
      if (!match) {
        match = targetItems.find(t => {
          const normalizedTarget = t.optionValue.toLowerCase().trim();
          return (normalizedTarget.includes(normalizedSource) || normalizedSource.includes(normalizedTarget)) &&
            !newConnections.some(c => c.targetId === t.id);
        });
      }

      if (match) {
        newConnections.push({
          id: `${source.id}→${match.id}`,
          sourceId: source.id,
          targetId: match.id,
          source,
          target: match,
          isNew: true,
        });
      }
    });

    setConnections(newConnections);
    toast.success(`${newConnections.length} mapping(s) auto-détecté(s)`);
  }, [sourceItems, targetItems]);

  // Save all new connections
  const handleSaveAll = useCallback(async () => {
    const newConnections = connections.filter(c => c.isNew);
    if (newConnections.length === 0) {
      toast.info('Aucun nouveau mapping à sauvegarder');
      return;
    }

    const inputs = newConnections.map(c => ({
      source_option_name: c.source.optionName,
      source_option_value: c.source.optionValue,
      target_option_name: c.target.optionName,
      target_option_value: c.target.optionValue,
      source_sku: c.source.sku,
    }));

    bulkCreateMutation.mutate(inputs, {
      onSuccess: () => {
        setConnections(prev => prev.map(c => ({ ...c, isNew: false })));
        toast.success(`${inputs.length} mapping(s) sauvegardé(s)`);
      },
    });
  }, [connections, bulkCreateMutation]);

  const handleReset = useCallback(() => {
    setConnections([]);
    toast.info('Mappings réinitialisés');
  }, []);

  const activeDragItem = useMemo(() => {
    if (!activeDragId) return null;
    const id = activeDragId.replace('source-', '');
    return sourceItems.find(s => s.id === id);
  }, [activeDragId, sourceItems]);

  const newCount = connections.filter(c => c.isNew).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Mapping Visuel Drag & Drop
            </CardTitle>
            <CardDescription>
              Glissez une variante fournisseur sur une variante boutique pour créer un mapping
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoMap}>
              <Wand2 className="h-4 w-4 mr-2" />
              Auto-mapper
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            {newCount > 0 && (
              <Button size="sm" onClick={handleSaveAll} disabled={bulkCreateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder ({newCount})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4">
            {/* Source Column - Supplier Variants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Fournisseur
                </h3>
                <Badge variant="secondary">{filteredSources.length}</Badge>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchSource}
                    onChange={(e) => setSearchSource(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[100px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {optionTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-1.5">
                  {filteredSources.map(item => (
                    <DraggableVariant
                      key={item.id}
                      item={item}
                      side="source"
                      isMapped={mappedSourceIds.has(item.id)}
                    />
                  ))}
                  {filteredSources.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucune variante trouvée
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Center Column - Connections */}
            <div className="hidden lg:flex flex-col items-center space-y-3 min-w-[250px]">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Connexions
              </h3>
              <Badge variant={newCount > 0 ? 'default' : 'secondary'}>
                {connections.length} lien{connections.length !== 1 ? 's' : ''}
              </Badge>

              <ScrollArea className="h-[400px] w-full pr-2">
                <div className="space-y-1.5">
                  <AnimatePresence mode="popLayout">
                    {connections.map(conn => (
                      <ConnectionLine
                        key={conn.id}
                        connection={conn}
                        onRemove={() => removeConnection(conn.id)}
                      />
                    ))}
                  </AnimatePresence>
                  {connections.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <Unlink className="h-8 w-8 opacity-30" />
                      <p className="text-sm text-center">
                        Glissez une variante<br />pour créer un lien
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Target Column - Store Variants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Boutique
                </h3>
                <Badge variant="secondary">{filteredTargets.length}</Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTarget}
                  onChange={(e) => setSearchTarget(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-1.5">
                  {filteredTargets.map(item => (
                    <DroppableTarget key={item.id} item={item}>
                      <DraggableVariant
                        item={item}
                        side="target"
                        isMapped={mappedTargetIds.has(item.id)}
                      />
                    </DroppableTarget>
                  ))}
                  {filteredTargets.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucune variante trouvée
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDragItem && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary bg-card shadow-lg">
                <GripVertical className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{activeDragItem.optionValue}</p>
                  <p className="text-xs text-muted-foreground">{activeDragItem.optionName}</p>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Mobile Connections (visible on small screens) */}
        <div className="lg:hidden mt-4 space-y-2">
          {connections.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-muted-foreground">Connexions ({connections.length})</h3>
              <AnimatePresence mode="popLayout">
                {connections.map(conn => (
                  <ConnectionLine
                    key={conn.id}
                    connection={conn}
                    onRemove={() => removeConnection(conn.id)}
                  />
                ))}
              </AnimatePresence>
              {newCount > 0 && (
                <Button className="w-full mt-2" onClick={handleSaveAll} disabled={bulkCreateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder ({newCount})
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
