import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Workflow, 
  Play, 
  Clock, 
  Mail, 
  ShoppingCart,
  Users,
  Settings,
  Plus,
  X,
  ArrowRight
} from 'lucide-react'

interface AutomationWorkflowModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export const AutomationWorkflowModal: React.FC<AutomationWorkflowModalProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: '',
    trigger_config: {},
    steps: []
  })

  const [currentStep, setCurrentStep] = useState({
    type: '',
    config: {},
    name: ''
  })

  const triggerTypes = [
    { value: 'schedule', label: 'Planification', icon: <Clock className="w-4 h-4" /> },
    { value: 'webhook', label: 'Webhook', icon: <Play className="w-4 h-4" /> },
    { value: 'email_received', label: 'Email reçu', icon: <Mail className="w-4 h-4" /> },
    { value: 'order_created', label: 'Nouvelle commande', icon: <ShoppingCart className="w-4 h-4" /> },
    { value: 'customer_signup', label: 'Inscription client', icon: <Users className="w-4 h-4" /> }
  ]

  const stepTypes = [
    { value: 'send_email', label: 'Envoyer un email', icon: <Mail className="w-4 h-4" /> },
    { value: 'update_database', label: 'Mettre à jour BDD', icon: <Settings className="w-4 h-4" /> },
    { value: 'call_api', label: 'Appeler une API', icon: <Play className="w-4 h-4" /> },
    { value: 'wait', label: 'Attendre', icon: <Clock className="w-4 h-4" /> },
    { value: 'condition', label: 'Condition', icon: <ArrowRight className="w-4 h-4" /> }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: '',
      trigger_config: {},
      steps: []
    })
    setCurrentStep({
      type: '',
      config: {},
      name: ''
    })
  }

  const addStep = () => {
    if (currentStep.type && currentStep.name) {
      setFormData({
        ...formData,
        steps: [...formData.steps, currentStep]
      })
      setCurrentStep({
        type: '',
        config: {},
        name: ''
      })
    }
  }

  const removeStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index)
    })
  }

  const getTriggerIcon = (type: string) => {
    const trigger = triggerTypes.find(t => t.value === type)
    return trigger?.icon || <Play className="w-4 h-4" />
  }

  const getStepIcon = (type: string) => {
    const step = stepTypes.find(s => s.value === type)
    return step?.icon || <Settings className="w-4 h-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Créer un Workflow d'Automatisation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du workflow</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Email de bienvenue automatique"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trigger">Déclencheur</Label>
                  <Select 
                    value={formData.trigger_type} 
                    onValueChange={(value) => setFormData({...formData, trigger_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un déclencheur" />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerTypes.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          <div className="flex items-center gap-2">
                            {trigger.icon}
                            {trigger.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Décrivez ce que fait ce workflow..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Trigger Configuration */}
          {formData.trigger_type && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {getTriggerIcon(formData.trigger_type)}
                  Configuration du déclencheur
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.trigger_type === 'schedule' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fréquence</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez la fréquence" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Quotidien</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                            <SelectItem value="monthly">Mensuel</SelectItem>
                            <SelectItem value="custom">Personnalisé (cron)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Heure</Label>
                        <Input type="time" defaultValue="09:00" />
                      </div>
                    </div>
                  </div>
                )}

                {formData.trigger_type === 'webhook' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL Webhook</Label>
                      <Input 
                        placeholder="https://votre-site.com/webhook" 
                        disabled
                        value="https://api.votre-app.com/webhooks/generate-unique-id"
                      />
                      <p className="text-xs text-muted-foreground">
                        Cette URL sera générée automatiquement après création
                      </p>
                    </div>
                  </div>
                )}

                {formData.trigger_type === 'email_received' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Adresse email surveillée</Label>
                      <Input placeholder="support@votre-site.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Filtre objet (optionnel)</Label>
                      <Input placeholder="Ex: [URGENT] ou commande" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Workflow Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Étapes du workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Steps */}
              {formData.steps.length > 0 && (
                <div className="space-y-3">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        {getStepIcon(step.type)}
                        <span className="font-medium">{step.name}</span>
                      </div>
                      <Badge variant="outline">
                        {stepTypes.find(s => s.value === step.type)?.label}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeStep(index)}
                        className="ml-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Step */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Ajouter une étape</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type d'étape</Label>
                        <Select 
                          value={currentStep.type} 
                          onValueChange={(value) => setCurrentStep({...currentStep, type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez le type" />
                          </SelectTrigger>
                          <SelectContent>
                            {stepTypes.map((step) => (
                              <SelectItem key={step.value} value={step.value}>
                                <div className="flex items-center gap-2">
                                  {step.icon}
                                  {step.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Nom de l'étape</Label>
                        <Input
                          value={currentStep.name}
                          onChange={(e) => setCurrentStep({...currentStep, name: e.target.value})}
                          placeholder="Ex: Envoyer email de bienvenue"
                        />
                      </div>
                    </div>

                    {/* Step Configuration */}
                    {currentStep.type === 'send_email' && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-2">
                          <Label>Template email</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="welcome">Email de bienvenue</SelectItem>
                              <SelectItem value="order_confirmation">Confirmation de commande</SelectItem>
                              <SelectItem value="abandoned_cart">Panier abandonné</SelectItem>
                              <SelectItem value="custom">Template personnalisé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {currentStep.type === 'wait' && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Durée</Label>
                            <Input type="number" placeholder="5" />
                          </div>
                          <div className="space-y-2">
                            <Label>Unité</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Unité" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minutes">Minutes</SelectItem>
                                <SelectItem value="hours">Heures</SelectItem>
                                <SelectItem value="days">Jours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button type="button" onClick={addStep} disabled={!currentStep.type || !currentStep.name}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter cette étape
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Preview */}
          {formData.steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aperçu du workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg">
                    {getTriggerIcon(formData.trigger_type)}
                    <span className="text-sm font-medium">
                      {triggerTypes.find(t => t.value === formData.trigger_type)?.label}
                    </span>
                  </div>
                  
                  {formData.steps.map((step, index) => (
                    <React.Fragment key={index}>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                        {getStepIcon(step.type)}
                        <span className="text-sm">{step.name}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.trigger_type || formData.steps.length === 0}>
              Créer le workflow
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
