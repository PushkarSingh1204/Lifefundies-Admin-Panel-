import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, badge }) => (
  <div className="page-header">
    <div className="page-header__left">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <h1 className="page-header__title">{title}</h1>
        {badge}
      </div>
      {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </div>
);

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchValue,
  onSearchChange,
  placeholder = 'Search...',
  filters,
  actions,
}) => (
  <div className="search-filter-bar card">
    <div className="search-wrapper" style={{ flex: 1 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-subtle)', pointerEvents: 'none' }}>
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={searchValue}
        onChange={e => onSearchChange(e.target.value)}
        style={{ paddingLeft: 38 }}
      />
    </div>
    {filters}
    {actions}
  </div>
);

interface TableWrapperProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const TableWrapper: React.FC<TableWrapperProps> = ({ children, footer }) => (
  <div className="table-card">
    <div className="table-container" style={{ border: 'none', borderRadius: 0, margin: 0 }}>
      {children}
    </div>
    {footer && <div className="table-footer">{footer}</div>}
  </div>
);

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, pageSize, total, onPageChange }) => {
  const totalPages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="pagination">
      <span className="pagination__info">
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> results
      </span>
      <div className="pagination__controls">
        <button
          className="btn btn-outline pagination__btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          ‹ Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="pagination__dots">…</span>
            ) : (
              <button
                key={p}
                className={`btn pagination__btn ${page === p ? 'pagination__btn--active' : 'btn-outline'}`}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </button>
            )
          )}
        <button
          className="btn btn-outline pagination__btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next ›
        </button>
      </div>
    </div>
  );
};

// CSV Export utility
export function exportToCSV(filename: string, data: Record<string, unknown>[]) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Sort helper
export type SortDir = 'asc' | 'desc';
export function useSortableData<T>(items: T[]) {
  const [sortKey, setSortKey] = React.useState<keyof T | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');

  const sorted = React.useMemo(() => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  const requestSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return { sorted, sortKey, sortDir, requestSort };
}

interface SortableThProps {
  label: string;
  sortKey?: string;
  currentSortKey?: string | null;
  sortDir?: SortDir;
  onSort?: () => void;
}

export const SortableTh: React.FC<SortableThProps> = ({
  label,
  sortKey,
  currentSortKey,
  sortDir,
  onSort,
}) => {
  const isActive = sortKey && currentSortKey === sortKey;
  return (
    <th
      onClick={onSort}
      style={{ cursor: onSort ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {sortKey && (
          <span style={{ opacity: isActive ? 1 : 0.3, fontSize: '0.65rem' }}>
            {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
          </span>
        )}
      </span>
    </th>
  );
};
