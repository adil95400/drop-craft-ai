import { useState } from 'react';
import { AdvancedLiveChat } from '@/components/support/AdvancedLiveChat';

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AdvancedLiveChat 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
    />
  );
}
