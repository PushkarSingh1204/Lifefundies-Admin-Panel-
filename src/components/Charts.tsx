import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ─── Color palette ───────────────────────────────────────────
const C_BLUE   = '#2563EB';
const C_GREEN  = '#10B981';
const C_AMBER  = '#F59E0B';
const C_RED    = '#EF4444';
const C_VIOLET = '#8B5CF6';
const C_TEAL   = '#14B8A6';

// ─── Custom Tooltip ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--clr-bg-card)',
      border: '1px solid var(--clr-border)',
      borderRadius: 'var(--radius-sm)',
      padding: '8px 12px',
      boxShadow: 'var(--shadow-md)',
      fontSize: '0.8rem',
    }}>
      {label && <p style={{ color: 'var(--clr-text-muted)', marginBottom: 4, fontWeight: 500 }}>{label}</p>}
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {prefix}{Number(entry.value).toLocaleString('en-IN')}{suffix}
        </p>
      ))}
    </div>
  );
};

// ─── Revenue Area Chart ───────────────────────────────────────
interface RevenueChartProps {
  data: { label: string; revenue: number }[];
}
export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={C_BLUE} stopOpacity={0.25} />
          <stop offset="95%" stopColor={C_BLUE} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--clr-text-subtle)' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: 'var(--clr-text-subtle)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={48} />
      <Tooltip content={<CustomTooltip prefix="₹" />} />
      <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C_BLUE} strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── User Growth Area Chart ───────────────────────────────────
interface UserGrowthChartProps {
  data: { label: string; users: number; mentors: number }[];
}
export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={C_VIOLET} stopOpacity={0.25} />
          <stop offset="95%" stopColor={C_VIOLET} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="mentorsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={C_GREEN} stopOpacity={0.25} />
          <stop offset="95%" stopColor={C_GREEN} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--clr-text-subtle)' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: 'var(--clr-text-subtle)' }} axisLine={false} tickLine={false} width={32} />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Area type="monotone" dataKey="users" name="Users" stroke={C_VIOLET} strokeWidth={2} fill="url(#usersGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      <Area type="monotone" dataKey="mentors" name="Mentors" stroke={C_GREEN} strokeWidth={2} fill="url(#mentorsGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── Sessions / Bookings Bar Chart ────────────────────────────
interface SessionsBarChartProps {
  data: { label: string; bookings: number; sessions: number }[];
}
export const SessionsBarChart: React.FC<SessionsBarChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={3}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--clr-text-subtle)' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: 'var(--clr-text-subtle)' }} axisLine={false} tickLine={false} width={32} />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Bar dataKey="bookings" name="Bookings" fill={C_BLUE} radius={[4, 4, 0, 0]} maxBarSize={18} />
      <Bar dataKey="sessions" name="Sessions" fill={C_TEAL} radius={[4, 4, 0, 0]} maxBarSize={18} />
    </BarChart>
  </ResponsiveContainer>
);

// ─── Payment Status Donut ─────────────────────────────────────
interface PaymentDonutProps {
  completed: number;
  pending: number;
  failed: number;
  refunded: number;
}
export const PaymentDonut: React.FC<PaymentDonutProps> = ({ completed, pending, failed, refunded }) => {
  const data = [
    { name: 'Completed', value: completed, color: C_GREEN },
    { name: 'Pending',   value: pending,   color: C_AMBER },
    { name: 'Failed',    value: failed,    color: C_RED   },
    { name: 'Refunded',  value: refunded,  color: C_TEAL  },
  ].filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v: any) => [`${v} (${((Number(v || 0) / total) * 100).toFixed(1)}%)`, '']} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <p style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>{total}</p>
        <p style={{ fontSize: '0.65rem', color: 'var(--clr-text-subtle)', marginTop: 2 }}>Total</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
        {data.map(d => (
          <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
            {d.name}: {d.value}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Community Activity Bar Chart ─────────────────────────────
interface CommunityChartProps {
  data: { label: string; posts: number; comments: number }[];
}
export const CommunityChart: React.FC<CommunityChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={180}>
    <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--clr-text-subtle)' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 10, fill: 'var(--clr-text-subtle)' }} axisLine={false} tickLine={false} width={28} />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="posts" name="Posts" fill={C_AMBER} radius={[3, 3, 0, 0]} maxBarSize={14} />
      <Bar dataKey="comments" name="Comments" fill={C_VIOLET} radius={[3, 3, 0, 0]} maxBarSize={14} />
    </BarChart>
  </ResponsiveContainer>
);

// ─── Progress Ring (SVG) ──────────────────────────────────────
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}
export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 72,
  stroke = 7,
  color = C_GREEN,
  label,
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--clr-border)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{Math.round(pct * 100)}%</p>
        {label && <p style={{ fontSize: '0.7rem', color: 'var(--clr-text-subtle)' }}>{label}</p>}
      </div>
    </div>
  );
};
