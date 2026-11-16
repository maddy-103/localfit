import { useId } from 'react';
import { cx } from '@/lib/cx';
import styles from './surfaces.module.css';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  items: readonly TabItem[];
  active: string;
  onChange: (id: string) => void;
  label: string;
}

export function Tabs({ items, active, onChange, label }: TabsProps) {
  const baseId = useId();

  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${baseId}-${item.id}-tab`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={cx(styles.tab, selected && styles.tabActive)}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
              event.preventDefault();
              const index = items.findIndex((entry) => entry.id === item.id);
              const offset = event.key === 'ArrowRight' ? 1 : -1;
              const next = items[(index + offset + items.length) % items.length];
              if (!next) return;
              onChange(next.id);
              document.getElementById(`${baseId}-${next.id}-tab`)?.focus();
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
