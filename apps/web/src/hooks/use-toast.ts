// This file maintains compatibility with the shadcn/ui toast system
// For this project, we use sonner for toasts, so we just re-export its functionality

export { toast } from "sonner"

// For compatibility with existing code that might expect useToast hook
export const useToast = () => {
  return {
    toast: (options: any) => {
      // This is a compatibility layer for existing code
      console.log('useToast called with:', options);
    }
  }
}