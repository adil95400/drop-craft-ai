import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateAutomationRule } from './CreateAutomationRule';

interface AutomationRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutomationRuleModal({ open, onOpenChange }: AutomationRuleModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle Règle d'Automatisation</DialogTitle>
        </DialogHeader>
        <CreateAutomationRule onClose={handleClose} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}