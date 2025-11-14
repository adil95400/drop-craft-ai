import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, DollarSign } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface Expense {
  id: string
  category: string
  amount: number
  date: string
  description?: string
}

interface ExpenseTrackerProps {
  expenses: Expense[]
}

const EXPENSE_CATEGORIES = [
  'Publicités Facebook',
  'Publicités TikTok',
  'Publicités Google',
  'Outils & Software',
  'Fournisseurs',
  'Assistants Virtuels',
  'Frais Bancaires',
  'Autres'
]

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#6366f1'
]

export const ExpenseTracker = ({ expenses }: ExpenseTrackerProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExpense, setNewExpense] = useState({
    category: 'Publicités Facebook',
    amount: 0,
    description: ''
  })

  // Add expense mutation
  const addExpense = useMutation({
    mutationFn: async (expense: typeof newExpense) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          user_id: user.id,
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profit-data'] })
      toast({
        title: "Dépense ajoutée",
        description: "La dépense a été enregistrée avec succès"
      })
      setShowAddForm(false)
      setNewExpense({ category: 'Publicités Facebook', amount: 0, description: '' })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la dépense",
        variant: "destructive"
      })
    }
  })

  // Delete expense mutation
  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profit-data'] })
      toast({
        title: "Dépense supprimée",
        description: "La dépense a été retirée"
      })
    }
  })

  // Calculate category totals
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value
  }))

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Expense Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Répartition des Dépenses</h3>
        
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Aucune dépense enregistrée
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Total Dépenses</p>
          <p className="text-3xl font-bold">{totalExpenses.toFixed(2)} €</p>
        </div>
      </Card>

      {/* Expense List & Add Form */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Historique</h3>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <div>
              <Label>Catégorie</Label>
              <Select
                value={newExpense.category}
                onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Montant (€)</Label>
              <Input
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
            </div>

            <div>
              <Label>Description (optionnel)</Label>
              <Input
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="Ex: Campagne produit X"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={() => addExpense.mutate(newExpense)}
              disabled={addExpense.isPending || newExpense.amount <= 0}
            >
              Enregistrer
            </Button>
          </div>
        )}

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <div 
                key={expense.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{expense.category}</p>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(expense.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-lg">{expense.amount.toFixed(2)} €</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteExpense.mutate(expense.id)}
                    disabled={deleteExpense.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune dépense enregistrée</p>
              <p className="text-sm mt-1">Ajoutez vos premières dépenses ci-dessus</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
