import React, { useEffect, useRef, useState } from 'react';

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: number; // positive = up, negative = down
  trendLabel?: string;
  loading?: boolean;
  format?: 'number' | 'currency' | 'percent';
}

function useCountUp(target: number, duration: number = 1000, start: boolean = true) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, start]);

  return count;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  icon,
  iconBg,
  iconColor,
  trend,
  trendLabel,
  loading = false,
  format = 'number',
}) => {
  const animatedValue = useCountUp(value, 900, !loading);

  const formatValue = (v: number) => {
    if (format === 'currency') return `${prefix}${v.toLocaleString('en-IN')}`;
    if (format === 'percent') return `${v}%`;
    return `${prefix}${v.toLocaleString()}${suffix}`;
  };

  if (loading) {
    return (
      <div className="kpi-card card">
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          <div className="skeleton skeleton-title" style={{ width: '40%', marginTop: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="kpi-card card animate-fadeInUp">
      <div className="kpi-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="kpi-body">
        <p className="kpi-label">{title}</p>
        <p className="kpi-value">{formatValue(animatedValue)}</p>
        {trend !== undefined && (
          <span className={`kpi-trend ${trend >= 0 ? 'kpi-trend--up' : 'kpi-trend--down'}`}>
            <span>{trend >= 0 ? '▲' : '▼'}</span>
            <span>{Math.abs(trend)}%</span>
            {trendLabel && <span className="kpi-trend-label">{trendLabel}</span>}
          </span>
        )}
      </div>
    </div>
  );
};
