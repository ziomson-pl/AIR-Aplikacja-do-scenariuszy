import { useCallback, useRef, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export function useToasts(timeout = 3200) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), timeout);
    },
    [dismiss, timeout],
  );

  return { toasts, notify, dismiss };
}
