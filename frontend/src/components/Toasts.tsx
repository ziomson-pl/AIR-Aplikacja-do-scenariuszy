import type { Toast } from '../hooks/useToasts';

interface Props {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const ICON: Record<Toast['kind'], string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export function Toasts({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`} onClick={() => onDismiss(t.id)}>
          <span className="toast-icon">{ICON[t.kind]}</span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
