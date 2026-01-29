// Utility to audit and classify button intents across the application

export type ButtonIntent = 'navigate' | 'submit' | 'mutate' | 'open-modal' | 'action' | 'toggle';

export interface ButtonAuditResult {
  element: string;
  intent: ButtonIntent;
  issues: string[];
  suggestions: string[];
  file: string;
  line: number;
}

export class ButtonAuditor {
  static classifyIntent(onClickContent: string, context: string): ButtonIntent {
    // Navigation patterns
    if (onClickContent.includes('navigate') || onClickContent.includes('router.push') || 
        onClickContent.includes('Link') || onClickContent.includes('href')) {
      return 'navigate';
    }
    
    // Form submission patterns
    if (context.includes('form') || onClickContent.includes('submit') || 
        onClickContent.includes('handleSubmit')) {
      return 'submit';
    }
    
    // Modal/Dialog patterns
    if (onClickContent.includes('modal') || onClickContent.includes('dialog') || 
        onClickContent.includes('Modal') || onClickContent.includes('Dialog') ||
        onClickContent.includes('open') && context.includes('Modal')) {
      return 'open-modal';
    }
    
    // Mutation patterns (API calls, state changes)
    if (onClickContent.includes('mutate') || onClickContent.includes('fetch') || 
        onClickContent.includes('api') || onClickContent.includes('delete') ||
        onClickContent.includes('create') || onClickContent.includes('update')) {
      return 'mutate';
    }
    
    // Toggle patterns
    if (onClickContent.includes('toggle') || onClickContent.includes('set') && 
        onClickContent.includes('!')) {
      return 'toggle';
    }
    
    return 'action';
  }

  static auditOnClick(onClickContent: string, context: string, file: string, line: number): ButtonAuditResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for fake handlers
    if (onClickContent.includes('console.log')) {
      issues.push('Contains console.log - appears to be a placeholder');
      suggestions.push('Replace with actual implementation');
    }
    
    if (onClickContent.includes('toast.success') && !onClickContent.includes('await') && 
        !onClickContent.includes('fetch') && !onClickContent.includes('mutate')) {
      issues.push('Shows success toast without actual action');
      suggestions.push('Add real action before showing success toast');
    }
    
    if (onClickContent.includes('() => {}') || onClickContent === 'void') {
      issues.push('Empty onClick handler');
      suggestions.push('Implement the intended functionality');
    }
    
    // Check for form button issues
    if (context.includes('<form>') && !context.includes('type="button"') && 
        !context.includes('type="submit"')) {
      issues.push('Button in form without explicit type');
      suggestions.push('Add type="button" or type="submit"');
    }
    
    // Check for accessibility issues
    if (!context.includes('aria-') && onClickContent.includes('async')) {
      suggestions.push('Add aria-busy for async actions');
    }
    
    const intent = this.classifyIntent(onClickContent, context);
    
    return {
      element: context.includes('Button') ? 'Button' : 'button',
      intent,
      issues,
      suggestions,
      file,
      line
    };
  }
}

// Common button implementation patterns
export const BUTTON_PATTERNS = {
  navigate: {
    implementation: 'const navigate = useNavigate(); onClick={() => navigate("/path")}',
    component: 'Use <Link> component or useNavigate hook'
  },
  submit: {
    implementation: 'type="submit" with form handling',
    component: 'AsyncButton with type="submit" and form validation'
  },
  mutate: {
    implementation: 'useMutation with onSuccess/onError',
    component: 'AsyncButton with React Query mutation'
  },
  'open-modal': {
    implementation: 'onClick={() => setModalOpen(true)}',
    component: 'Button with ConfirmDialog or modal state'
  }
};