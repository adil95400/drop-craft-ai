/**
 * AutomationFlowCanvas - Visual node-based workflow editor
 * Displays workflow steps as connected nodes with status indicators
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Plus, Zap, Clock, Mail, Database, ShoppingCart, AlertTriangle,
  ArrowDown, Trash2, GripVertical, Settings2, CheckCircle2, XCircle,
  GitBranch, Filter, Bell, DollarSign, Package, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'branch';
  label: string;
  config: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'failed';
}

interface AutomationFlowCanvasProps {
  nodes?: FlowNode[];
  onNodesChange?: (nodes: FlowNode[]) => void;
  readOnly?: boolean;
}

const NODE_TYPES = [
  { type: 'trigger', label: 'Déclencheur', icon: Zap, color: 'border-purple-500 bg-purple-500/10' },
  { type: 'condition', label: 'Condition IF', icon: GitBranch, color: 'border-amber-500 bg-amber-500/10' },
  { type: 'action', label: 'Action', icon: Zap, color: 'border-blue-500 bg-blue-500/10' },
  { type: 'delay', label: 'Délai', icon: Clock, color: 'border-gray-500 bg-gray-500/10' },
  { type: 'branch', label: 'Branche', icon: Filter, color: 'border-green-500 bg-green-500/10' },
] as const;

const ACTION_PRESETS = [
  { id: 'email', label: 'Envoyer Email', icon: Mail },
  { id: 'notify', label: 'Notification', icon: Bell },
  { id: 'update_price', label: 'Modifier Prix', icon: DollarSign },
  { id: 'update_stock', label: 'Modifier Stock', icon: Package },
  { id: 'sync', label: 'Synchroniser', icon: RefreshCw },
  { id: 'order', label: 'Commande Auto', icon: ShoppingCart },
  { id: 'db_update', label: 'Mise à jour DB', icon: Database },
  { id: 'alert', label: 'Alerte Critique', icon: AlertTriangle },
];

const DEFAULT_NODES: FlowNode[] = [
  { id: '1', type: 'trigger', label: 'Stock < seuil', config: { event: 'stock_low', threshold: 10 }, status: 'success' },
  { id: '2', type: 'condition', label: 'Si marge > 15%', config: { field: 'margin', operator: '>', value: 15 }, status: 'success' },
  { id: '3', type: 'action', label: 'Commander fournisseur', config: { action: 'auto_reorder' }, status: 'running' },
  { id: '4', type: 'delay', label: 'Attendre 30min', config: { duration: 1800 }, status: 'idle' },
  { id: '5', type: 'action', label: 'Notifier équipe', config: { action: 'notify' }, status: 'idle' },
];

export function AutomationFlowCanvas({ nodes: externalNodes, onNodesChange, readOnly = false }: AutomationFlowCanvasProps) {
  const [nodes, setNodes] = useState<FlowNode[]>(externalNodes || DEFAULT_NODES);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);

  const updateNodes = (newNodes: FlowNode[]) => {
    setNodes(newNodes);
    onNodesChange?.(newNodes);
  };

  const addNode = (afterIndex: number, type: FlowNode['type']) => {
    const preset = NODE_TYPES.find(n => n.type === type);
    const newNode: FlowNode = {
      id: crypto.randomUUID(),
      type,
      label: preset?.label || 'Nouvelle étape',
      config: {},
      status: 'idle',
    };
    const updated = [...nodes];
    updated.splice(afterIndex + 1, 0, newNode);
    updateNodes(updated);
    setShowAddMenu(null);
  };

  const removeNode = (id: string) => {
    updateNodes(nodes.filter(n => n.id !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  const getStatusIndicator = (status?: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getNodeStyle = (node: FlowNode) => {
    const config = NODE_TYPES.find(n => n.type === node.type);
    return config?.color || 'border-border bg-card';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5 text-primary" />
            Flow Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{nodes.length} étapes</Badge>
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={() => setShowAddMenu(nodes.length - 1)}>
                <Plus className="h-4 w-4 mr-1" /> Étape
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex flex-col items-center py-4 min-w-[300px]">
            <AnimatePresence mode="popLayout">
              {nodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center w-full max-w-md"
                >
                  {/* Node */}
                  <div
                    className={cn(
                      "w-full border-2 rounded-xl p-4 cursor-pointer transition-all relative group",
                      getNodeStyle(node),
                      selectedNode === node.id && "ring-2 ring-primary ring-offset-2",
                      node.status === 'running' && "animate-pulse"
                    )}
                    onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                  >
                    <div className="flex items-center gap-3">
                      {!readOnly && (
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono uppercase">
                            {node.type}
                          </Badge>
                          <span className="font-medium text-sm">{node.label}</span>
                        </div>
                        {node.config && Object.keys(node.config).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {JSON.stringify(node.config).slice(0, 60)}...
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIndicator(node.status)}
                        {!readOnly && node.type !== 'trigger' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connector + Add button */}
                  {index < nodes.length - 1 && (
                    <div className="flex flex-col items-center py-1 relative">
                      <div className="w-0.5 h-6 bg-border" />
                      {!readOnly && (
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 rounded-full border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
                            onClick={() => setShowAddMenu(showAddMenu === index ? null : index)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>

                          {showAddMenu === index && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute left-10 top-0 z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-[160px]"
                            >
                              {NODE_TYPES.filter(n => n.type !== 'trigger').map(nt => (
                                <button
                                  key={nt.type}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                                  onClick={() => addNode(index, nt.type as FlowNode['type'])}
                                >
                                  <nt.icon className="h-4 w-4" />
                                  {nt.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )}
                      <div className="w-0.5 h-6 bg-border" />
                      <ArrowDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Action Presets Bar */}
        {!readOnly && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Actions rapides</p>
            <div className="flex flex-wrap gap-2">
              {ACTION_PRESETS.map(preset => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => {
                    const newNode: FlowNode = {
                      id: crypto.randomUUID(),
                      type: 'action',
                      label: preset.label,
                      config: { action: preset.id },
                      status: 'idle',
                    };
                    updateNodes([...nodes, newNode]);
                  }}
                >
                  <preset.icon className="h-3 w-3 mr-1" />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
