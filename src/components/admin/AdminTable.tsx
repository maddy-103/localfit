import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Input } from '@/components/ui/Input';
import { cx } from '@/lib/cx';
import styles from './admin.module.css';

export interface AdminColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  numeric?: boolean;
}

export interface AdminTableProps<T> {
  columns: readonly AdminColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Screen-reader table caption. */
  caption: string;
  filterLabel?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterPlaceholder?: string;
  /** Extra filter controls, e.g. a status select. */
  toolbar?: ReactNode;
  /** Enter or Space on a focused row calls this, e.g. to open a detail page. */
  onRowActivate?: (row: T) => void;
  rowActionLabel?: (row: T) => string;
}

/**
 * One table for every admin queue: sticky header, text filter, extra filter
 * controls and arrow-key row navigation. State screens wrap it in AdminStates.
 */
export function AdminTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  filterLabel,
  filterValue,
  onFilterChange,
  filterPlaceholder,
  toolbar,
  onRowActivate,
  rowActionLabel,
}: AdminTableProps<T>) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, index: number): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const targetIndex = event.key === 'ArrowDown' ? index + 1 : index - 1;
      const next = bodyRef.current?.rows[targetIndex];
      if (next) {
        event.preventDefault();
        next.focus();
      }
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && onRowActivate) {
      event.preventDefault();
      onRowActivate(rows[index]!);
    }
  };

  return (
    <>
      {filterLabel && onFilterChange ? (
        <div className={styles.filters}>
          <Input
            label={filterLabel}
            icon="search"
            value={filterValue ?? ''}
            placeholder={filterPlaceholder}
            onChange={(event) => onFilterChange(event.target.value)}
          />
          {toolbar}
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption>{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={column.numeric ? styles.numeric : undefined}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {rows.map((row, index) => (
              <tr
                key={rowKey(row)}
                tabIndex={0}
                aria-label={rowActionLabel?.(row)}
                onKeyDown={(event) => onKeyDown(event, index)}
                onDoubleClick={onRowActivate ? () => onRowActivate(row) : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cx(column.numeric && styles.numeric, column.key === 'id' && styles.mono)}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
