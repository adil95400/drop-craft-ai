import { useState, useCallback } from "react";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        ...options,
        open: true,
        onConfirm: () => {
          resolve(true);
          setState(prev => ({ ...prev, open: false }));
        },
        onCancel: () => {
          resolve(false);
          setState(prev => ({ ...prev, open: false }));
        },
      });
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  return {
    confirm,
    close,
    confirmState: state,
    setConfirmOpen: (open: boolean) => setState(prev => ({ ...prev, open })),
  };
}