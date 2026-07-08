import React from 'react';

interface AnalyticsMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  chart?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
}

export const AnalyticsMetric: React.FC<AnalyticsMetricProps> = ({
  label,
  value,
  unit,
  chart,
  footer,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div className="skeleton" style={{ height: 20, width: '60%' }} />
        <div className="skeleton" style={{ height: 32, width: '80%' }} />
        {chart && <div className="skeleton" style={{ height: 200 }} />}
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)' }}>{label}</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--sp-2)',
        }}
      >
        <span
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--clr-text)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)' }}>{unit}</span>
        )}
      </div>
      {chart && <div style={{ marginTop: 'var(--sp-2)' }}>{chart}</div>}
      {footer && (
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--clr-text-subtle)',
            paddingTop: 'var(--sp-2)',
            borderTop: '1px solid var(--clr-border)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
