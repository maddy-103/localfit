import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Icon } from '../icons/Icon';
import { useI18n } from '@/i18n';
import styles from './surfaces.module.css';

interface ToastItem {
  id: string;
  message: string;
}

interface ToastValue {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);
const TOAST_MS = 2400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [items, setItems] = useState<ToastItem[]>([]);
  const sequence = useRef(0);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string) => {
      sequence.current += 1;
      const id = `toast-${sequence.current}`;
      setItems((current) => [...current.slice(-2), { id, message }]);
      window.setTimeout(() => remove(id), TOAST_MS);
    },
    [remove],
  );

  const value = useMemo<ToastValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastViewport} role="status" aria-live="polite">
        {items.map((item) => (
          <div className={styles.toast} key={item.id}>
            <span className={styles.toastMessage}>{item.message}</span>
            <button
              type="button"
              className={styles.toastClose}
              aria-label={t('toast.dismiss')}
              onClick={() => remove(item.id)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
