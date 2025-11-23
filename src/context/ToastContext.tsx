import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType } from '../components/shared/Toast';
import { ToastComponent } from '../components/shared/Toast';

interface ToastContextType {
  showToast: (type: ToastType, message: string, options?: { etherscanLink?: string; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (type: ToastType, message: string, options?: { etherscanLink?: string; duration?: number }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = {
        id,
        type,
        message,
        etherscanLink: options?.etherscanLink,
        duration: options?.duration,
      };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end pointer-events-none">
        <div className="pointer-events-auto">
          {toasts.map((toast) => (
            <ToastComponent key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};



