/**
 * AutomationConditionBuilder - Advanced IF/THEN/ELSE visual rule builder
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GitBranch, ArrowRight, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
  connector: 'AND' | 'OR';
}

interface Rule {
  id: string;
  name: string;
  conditions: Condition[];
  thenActions: string[];
  elseActions: string[];
  isActive: boolean;
}

const FIELDS = [
  { value: 'stock', label: 'Stock' },
  { value: 'price', label: 'Prix' },
  { value: 'margin', label: 'Marge (%)' },
  { value: 'sales_velocity', label: 'Vélocité ventes' },
  { value: 'days_in_stock', label: 'Jours en stock' },
  { value: 'category', label: 'Catégorie' },
  { value: 'supplier', label: 'Fournisseur' },
  { value: 'weight', label: 'Poids (kg)' },
];

const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'contains', label: 'Contient' },
  { value: 'not_contains', label: 'Ne contient pas' },
];

const ACTIONS = [
  'Envoyer alerte email',
  'Notification push',
  'Modifier prix (+/- %)',
  'Mettre en pause produit',
  'Commander fournisseur',
  'Appliquer tag',
  'Déplacer catégorie',
  'Logger événement',
];

const DEFAULT_RULES: Rule[] = [
  {
    id: '1',
    name: 'Stock critique → Réapprovisionnement',
    conditions: [
      { id: 'c1', field: 'stock', operator: 'lt', value: '10', connector: 'AND' },
      { id: 'c2', field: 'sales_velocity', operator: 'gt', value: '5', connector: 'AND' },
    ],
    thenActions: ['Commander fournisseur', 'Envoyer alerte email'],
    elseActions: ['Logger événement'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Marge basse → Protection',
    conditions: [
      { id: 'c3', field: 'margin', operator: 'lt', value: '15', connector: 'AND' },
    ],
    thenActions: ['Modifier prix (+/- %)', 'Notification push'],
    elseActions: [],
    isActive: true,
  },
];

export function AutomationConditionBuilder() {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [editingRule, setEditingRule] = useState<string | null>(null);

  const addCondition = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? {
      ...r,
      conditions: [...r.conditions, { id: crypto.randomUUID(), field: 'stock', operator: 'gt', value: '', connector: 'AND' }]
    } : r));
  };

  const removeCondition = (ruleId: string, condId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? {
      ...r,
      conditions: r.conditions.filter(c => c.id !== condId)
    } : r));
  };

  const updateCondition = (ruleId: string, condId: string, field: string, value: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? {
      ...r,
      conditions: r.conditions.map(c => c.id === condId ? { ...c, [field]: value } : c)
    } : r));
  };

  const addRule = () => {
    const newRule: Rule = {
      id: crypto.randomUUID(),
      name: 'Nouvelle règle',
      conditions: [{ id: crypto.randomUUID(), field: 'stock', operator: 'lt', value: '', connector: 'AND' }],
      thenActions: [],
      elseActions: [],
      isActive: true,
    };
    setRules(prev => [...prev, newRule]);
    setEditingRule(newRule.id);
  };

  const duplicateRule = (rule: Rule) => {
    const dup: Rule = {
      ...rule,
      id: crypto.randomUUID(),
      name: `${rule.name} (copie)`,
      conditions: rule.conditions.map(c => ({ ...c, id: crypto.randomUUID() })),
    };
    setRules(prev => [...prev, dup]);
    toast.success('Règle dupliquée');
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.info('Règle supprimée');
  };

  const toggleAction = (ruleId: string, type: 'then' | 'else', action: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      const key = type === 'then' ? 'thenActions' : 'elseActions';
      const current = r[key];
      return {
        ...r,
        [key]: current.includes(action) ? current.filter(a => a !== action) : [...current, action]
      };
    }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5 text-primary" />
            Conditions & Règles
          </CardTitle>
          <Button size="sm" onClick={addRule}>
            <Plus className="h-4 w-4 mr-1" /> Règle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence>
          {rules.map((rule) => (
            <motion.div
              key={rule.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border rounded-xl p-4 space-y-3"
            >
              {/* Rule header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={rule.isActive ? 'default' : 'secondary'} className="text-xs">
                    {rule.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                  <Input
                    value={rule.name}
                    onChange={e => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, name: e.target.value } : r))}
                    className="h-7 text-sm font-medium border-none bg-transparent px-1 w-auto"
                  />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => duplicateRule(rule)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteRule(rule.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* IF Conditions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-purple-600 uppercase">IF</span>
                {rule.conditions.map((cond, idx) => (
                  <div key={cond.id} className="flex items-center gap-2 flex-wrap">
                    {idx > 0 && (
                      <Select value={cond.connector} onValueChange={v => updateCondition(rule.id, cond.id, 'connector', v)}>
                        <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">ET</SelectItem>
                          <SelectItem value="OR">OU</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Select value={cond.field} onValueChange={v => updateCondition(rule.id, cond.id, 'field', v)}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={cond.operator} onValueChange={v => updateCondition(rule.id, cond.id, 'operator', v)}>
                      <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      value={cond.value}
                      onChange={e => updateCondition(rule.id, cond.id, 'value', e.target.value)}
                      className="h-7 w-20 text-xs"
                      placeholder="Valeur"
                    />
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeCondition(rule.id, cond.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addCondition(rule.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Condition
                </Button>
              </div>

              {/* THEN */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-green-600 uppercase">THEN</span>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIONS.map(action => (
                    <Badge
                      key={action}
                      variant={rule.thenActions.includes(action) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs transition-colors"
                      onClick={() => toggleAction(rule.id, 'then', action)}
                    >
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* ELSE */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-orange-600 uppercase">ELSE</span>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIONS.map(action => (
                    <Badge
                      key={action}
                      variant={rule.elseActions.includes(action) ? 'secondary' : 'outline'}
                      className="cursor-pointer text-xs transition-colors opacity-75"
                      onClick={() => toggleAction(rule.id, 'else', action)}
                    >
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
