import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  ClipboardList,
  Video,
  CreditCard,
  UserPlus,
  CalendarDays,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Activity,
  Wifi,
  Clock,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';

import { KpiCard } from '../components/KpiCard';
import {
  RevenueChart,
  UserGrowthChart,
  SessionsBarChart,
  PaymentDonut,
  CommunityChart,
  ProgressRing,
} from '../components/Charts';
import { PageHeader } from '../components/DataTable';
import { SkeletonCard } from '../components/Skeleton';
import { db } from '../firebase/config';
import { auditAdminAccess, logFirestoreError } from '../utils/FirestoreAudit';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserDoc {
  joinedAt?: any;
  role?: string;
  mentorApplicationStatus?: string;
  domain?: string;
}

interface GuideDoc {
  totalSessions?: number;
  rating?: number;
  name?: string;
  isActive?: boolean;
}

interface SessionDoc {
  status?: string;
  scheduledAt?: any;
  createdAt?: any;
  day?: string;
}

interface PaymentDoc {
  status?: string;
  amount?: number;
  createdAt?: any;
  userId?: string;
  userName?: string;
}

interface BookingDoc {
  status?: string;
  scheduledAt?: any;
  createdAt?: any;
}

interface CommunityPostDoc {
  createdAt?: any;
  domain?: string;
}

// ─── Helper: getISOWeek ───────────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// ─── Helper: formatDate ───────────────────────────────────────────────────────

const formatDate = (ts: any): string => {
  const d = ts?.toDate?.() || new Date(ts || 0);
  return (
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) +
    ' · ' +
    d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  );
};

// ─── Loading counter hook ─────────────────────────────────────────────────────

function useLoadingCounter(count: number): [boolean, () => void] {
  const remaining = useRef(count);
  const [loading, setLoading] = useState(true);

  const tick = () => {
    remaining.current -= 1;
    if (remaining.current <= 0) setLoading(false);
  };

  return [loading, tick];
}

// ─── Dashboard Component ──────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  // ── Raw collection data ──────────────────────────────────────────────────
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [guides, setGuides] = useState<GuideDoc[]>([]);
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPostDoc[]>([]);

  // 4 main listeners fire the loading counter
  const [loading, tick] = useLoadingCounter(4);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // ── Run admin access audit on mount ──────────────────────────────────────
  useEffect(() => {
    if (import.meta.env.DEV) {
      auditAdminAccess();
    }
  }, []);

  // ── Firestore listeners ──────────────────────────────────────────────────
  useEffect(() => {
    let firstUsers = true;
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setUsers(snap.docs.map((d) => d.data() as UserDoc));
        if (firstUsers) { firstUsers = false; tick(); }
        setLastUpdated(new Date());
      },
      (err) => {
        logFirestoreError('Dashboard.users', err);
        if (firstUsers) { firstUsers = false; tick(); }
      }
    );

    let firstGuides = true;
    const unsubGuides = onSnapshot(
      collection(db, 'guides'),
      (snap) => {
        setGuides(snap.docs.map((d) => d.data() as GuideDoc));
        if (firstGuides) { firstGuides = false; tick(); }
      },
      (err) => {
        logFirestoreError('Dashboard.guides', err);
        if (firstGuides) { firstGuides = false; tick(); }
      }
    );

    let firstPayments = true;
    const unsubPayments = onSnapshot(
      collection(db, 'payments'),
      (snap) => {
        setPayments(snap.docs.map((d) => d.data() as PaymentDoc));
        if (firstPayments) { firstPayments = false; tick(); }
      },
      (err) => {
        logFirestoreError('Dashboard.payments', err);
        if (firstPayments) { firstPayments = false; tick(); }
      }
    );

    let firstSessions = true;
    const unsubSessions = onSnapshot(
      collection(db, 'sessions'),
      (snap) => {
        setSessions(snap.docs.map((d) => d.data() as SessionDoc));
        if (firstSessions) { firstSessions = false; tick(); }
      },
      (err) => {
        logFirestoreError('Dashboard.sessions', err);
        if (firstSessions) { firstSessions = false; tick(); }
      }
    );

    // bookings + community listen without counting towards the loading gate
    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snap) => {
        setBookings(snap.docs.map((d) => d.data() as BookingDoc));
      },
      (err) => {
        logFirestoreError('Dashboard.bookings', err);
      }
    );

    const unsubCommunity = onSnapshot(
      collection(db, 'community_posts'),
      (snap) => {
        setCommunityPosts(snap.docs.map((d) => d.data() as CommunityPostDoc));
      },
      (err) => {
        logFirestoreError('Dashboard.community', err);
      }
    );

    return () => {
      unsubUsers();
      unsubGuides();
      unsubPayments();
      unsubSessions();
      unsubBookings();
      unsubCommunity();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── KPI derivations ──────────────────────────────────────────────────────

  const totalUsers = users.length;
  const totalGuides = guides.length;

  const pendingAppsCount = users.filter(
    (u) => u.mentorApplicationStatus === 'pending'
  ).length;

  const activeSessionsCount = sessions.filter(
    (s) => s.status === 'active'
  ).length;

  const completedPayments = payments.filter((p) => p.status === 'completed');
  const totalRevenue = completedPayments.reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0
  );

  // Today's registrations
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayRegs = users.filter((u) => {
    if (!u.joinedAt) return false;
    const d = u.joinedAt?.toDate?.() || new Date(u.joinedAt);
    return d >= todayStart;
  }).length;

  // This month's registrations
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthRegs = users.filter((u) => {
    if (!u.joinedAt) return false;
    const d = u.joinedAt?.toDate?.() || new Date(u.joinedAt);
    return d >= monthStart;
  }).length;

  const communityPostCount = communityPosts.length;

  // ── Revenue Chart: last 8 weeks ──────────────────────────────────────────

  const revenueChartData = (() => {
    const now = new Date();
    const weeks: { label: string; revenue: number }[] = [];

    for (let i = 7; i >= 0; i--) {
      const weekDate = new Date(now);
      weekDate.setDate(now.getDate() - i * 7);
      weeks.push({ label: `Wk ${getISOWeek(weekDate)}`, revenue: 0 });
    }

    completedPayments.forEach((p) => {
      if (!p.createdAt) return;
      const d = p.createdAt?.toDate?.() || new Date(p.createdAt);
      const diffDays = Math.floor(
        (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays > 56) return; // beyond 8 weeks
      const weekIdx = Math.floor((56 - diffDays) / 7);
      if (weekIdx >= 0 && weekIdx < 8) {
        weeks[weekIdx].revenue += p.amount ?? 0;
      }
    });

    return weeks;
  })();

  // ── User Growth Chart: last 6 months cumulative ───────────────────────────

  const userGrowthData = (() => {
    const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const result: { label: string; users: number; mentors: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const cutoff = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const totalUpTo = users.filter((u) => {
        if (!u.joinedAt) return false;
        const joined = u.joinedAt?.toDate?.() || new Date(u.joinedAt);
        return joined < cutoff;
      }).length;
      const mentorsUpTo = users.filter((u) => {
        if (!u.joinedAt) return false;
        const joined = u.joinedAt?.toDate?.() || new Date(u.joinedAt);
        return joined < cutoff && u.role === 'mentor';
      }).length;
      result.push({
        label: monthLabels[d.getMonth()],
        users: totalUpTo,
        mentors: mentorsUpTo,
      });
    }
    return result;
  })();

  // ── Sessions Bar Chart: bookings + sessions by day-of-week (last 30 days) ─

  const sessionsBarData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const bookingCounts = [0, 0, 0, 0, 0, 0, 0];
    const sessionCounts = [0, 0, 0, 0, 0, 0, 0];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    bookings.forEach((b) => {
      const raw = b.scheduledAt || b.createdAt;
      if (!raw) return;
      const d = raw?.toDate?.() || new Date(raw);
      if (d < cutoff) return;
      const dow = (d.getDay() + 6) % 7; // Mon=0
      bookingCounts[dow]++;
    });

    sessions.forEach((s) => {
      const raw = s.scheduledAt || s.createdAt;
      if (!raw) return;
      const d = raw?.toDate?.() || new Date(raw);
      if (d < cutoff) return;
      const dow = (d.getDay() + 6) % 7;
      sessionCounts[dow]++;
    });

    return days.map((label, i) => ({
      label,
      bookings: bookingCounts[i],
      sessions: sessionCounts[i],
    }));
  })();

  // ── Payment Donut ────────────────────────────────────────────────────────

  const paymentDonutData = (() => {
    const counts = { completed: 0, pending: 0, failed: 0, refunded: 0 };
    payments.forEach((p) => {
      const s = p.status as keyof typeof counts;
      if (s in counts) counts[s]++;
    });
    return counts;
  })();

  // ── Community Chart: last 6 weeks ────────────────────────────────────────

  const communityChartData = (() => {
    const now = new Date();
    const weeks: { label: string; posts: number; comments: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const weekDate = new Date(now);
      weekDate.setDate(now.getDate() - i * 7);
      weeks.push({ label: `Wk ${getISOWeek(weekDate)}`, posts: 0, comments: 0 });
    }

    communityPosts.forEach((p) => {
      if (!p.createdAt) return;
      const d = p.createdAt?.toDate?.() || new Date(p.createdAt);
      const diffDays = Math.floor(
        (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays > 42) return; // beyond 6 weeks
      const weekIdx = Math.floor((42 - diffDays) / 7);
      if (weekIdx >= 0 && weekIdx < 6) {
        weeks[weekIdx].posts++;
      }
    });

    return weeks;
  })();

  // ── Top Domains ───────────────────────────────────────────────────────────

  const topDomains = (() => {
    const map: Record<string, number> = {};
    communityPosts.forEach((p) => {
      const domain = p.domain || 'General';
      map[domain] = (map[domain] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  })();

  const maxDomainCount = topDomains[0]?.[1] || 1;

  // ── Top Guides ────────────────────────────────────────────────────────────

  const topGuides = [...guides]
    .sort((a, b) => (b.totalSessions ?? 0) - (a.totalSessions ?? 0))
    .slice(0, 5);

  // ── Activity Feed ─────────────────────────────────────────────────────────

  const activityItems = (() => {
    type FeedItem = {
      id: string;
      type: 'user' | 'payment';
      text: string;
      ts: any;
      dotBg: string;
      dotColor: string;
    };

    const items: FeedItem[] = [];

    // Last 5 users
    const sortedUsers = [...users]
      .filter((u) => !!u.joinedAt)
      .sort((a, b) => {
        const ta = a.joinedAt?.toDate?.() || new Date(a.joinedAt);
        const tb = b.joinedAt?.toDate?.() || new Date(b.joinedAt);
        return tb.getTime() - ta.getTime();
      })
      .slice(0, 5);

    sortedUsers.forEach((u, i) => {
      items.push({
        id: `user-${i}`,
        type: 'user',
        text: `New user registered`,
        ts: u.joinedAt,
        dotBg: 'rgba(37,99,235,0.1)',
        dotColor: '#2563EB',
      });
    });

    // Last 5 payments
    const sortedPayments = [...payments]
      .filter((p) => !!p.createdAt)
      .sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const tb = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return tb.getTime() - ta.getTime();
      })
      .slice(0, 5);

    sortedPayments.forEach((p, i) => {
      const status = p.status ?? 'unknown';
      const dotBg =
        status === 'completed'
          ? 'rgba(16,185,129,0.1)'
          : status === 'failed'
          ? 'rgba(239,68,68,0.1)'
          : 'rgba(245,158,11,0.1)';
      const dotColor =
        status === 'completed'
          ? '#10B981'
          : status === 'failed'
          ? '#EF4444'
          : '#F59E0B';
      items.push({
        id: `payment-${i}`,
        type: 'payment',
        text: `Payment ${status}${p.amount ? ` — ₹${p.amount.toLocaleString('en-IN')}` : ''}`,
        ts: p.createdAt,
        dotBg,
        dotColor,
      });
    });

    // Sort merged list chronologically (newest first)
    return items
      .sort((a, b) => {
        const ta = a.ts?.toDate?.() || new Date(a.ts || 0);
        const tb = b.ts?.toDate?.() || new Date(b.ts || 0);
        return tb.getTime() - ta.getTime();
      })
      .slice(0, 10);
  })();

  // ── Platform Health ───────────────────────────────────────────────────────

  const totalPaymentsCount = payments.length;
  const completedCount = paymentDonutData.completed;
  const paymentSuccessRate =
    totalPaymentsCount > 0
      ? Math.round((completedCount / totalPaymentsCount) * 100)
      : 0;

  const activeGuides = guides.filter((g) => g.isActive).length;
  const activeGuidesRate =
    totalGuides > 0 ? Math.round((activeGuides / totalGuides) * 100) : 0;

  const confirmedBookings = bookings.filter(
    (b) => b.status === 'confirmed'
  ).length;
  const bookingFillRate =
    bookings.length > 0
      ? Math.round((confirmedBookings / bookings.length) * 100)
      : 0;

  // ── Render: Loading skeletons ─────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="animate-fadeIn"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}
      >
        <PageHeader
          title="Dashboard"
          subtitle="Platform overview — loading live data…"
        />
        <div className="kpi-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="chart-grid chart-grid--2col">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="chart-grid chart-grid--3col">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="animate-fadeIn"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}
    >
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        subtitle="Live platform analytics powered by Firestore"
        badge={
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Wifi size={11} />
            Live
          </span>
        }
      />

      {/* ── Pending Applications Alert ───────────────────────────────────── */}
      {pendingAppsCount > 0 && (
        <div
          className="card animate-fadeInUp"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--sp-4)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <AlertTriangle size={18} color="#F59E0B" />
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--clr-text)' }}>
              <strong>{pendingAppsCount}</strong> mentor application{pendingAppsCount !== 1 ? 's' : ''} awaiting review.
            </span>
          </div>
          <Link
            to="/applications"
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', borderColor: 'rgba(245,158,11,0.4)', color: '#F59E0B' }}
          >
            Review Now <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Users"
          value={totalUsers}
          icon={<Users size={20} />}
          iconBg="rgba(37,99,235,0.1)"
          iconColor="#2563EB"
        />
        <KpiCard
          title="Total Guides"
          value={totalGuides}
          icon={<GraduationCap size={20} />}
          iconBg="rgba(139,92,246,0.1)"
          iconColor="#8B5CF6"
        />
        <KpiCard
          title="Pending Applications"
          value={pendingAppsCount}
          icon={<ClipboardList size={20} />}
          iconBg="rgba(245,158,11,0.1)"
          iconColor="#F59E0B"
        />
        <KpiCard
          title="Active Sessions"
          value={activeSessionsCount}
          icon={<Video size={20} />}
          iconBg="rgba(20,184,166,0.1)"
          iconColor="#14B8A6"
        />
        <KpiCard
          title="Total Revenue"
          value={totalRevenue}
          format="currency"
          prefix="₹"
          icon={<CreditCard size={20} />}
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#10B981"
        />
        <KpiCard
          title="Today's Registrations"
          value={todayRegs}
          icon={<UserPlus size={20} />}
          iconBg="rgba(37,99,235,0.08)"
          iconColor="#2563EB"
        />
        <KpiCard
          title="This Month's Registrations"
          value={monthRegs}
          icon={<CalendarDays size={20} />}
          iconBg="rgba(139,92,246,0.08)"
          iconColor="#8B5CF6"
        />
        <KpiCard
          title="Community Posts"
          value={communityPostCount}
          icon={<MessageSquare size={20} />}
          iconBg="rgba(245,158,11,0.08)"
          iconColor="#F59E0B"
        />
      </div>

      {/* ── Chart Row 1 — 2 col ───────────────────────────────────────────── */}
      <div className="chart-grid chart-grid--2col">

        {/* Revenue Chart */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Weekly Revenue</p>
              <p className="chart-card__subtitle">Last 8 weeks · completed payments</p>
            </div>
          </div>
          {revenueChartData.every((d) => d.revenue === 0) ? (
            <div className="empty-state" style={{ minHeight: 220 }}>
              <p>No completed payment data yet.</p>
            </div>
          ) : (
            <RevenueChart data={revenueChartData} />
          )}
        </div>

        {/* User Growth Chart */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">User Growth</p>
              <p className="chart-card__subtitle">Last 6 months · cumulative</p>
            </div>
          </div>
          {userGrowthData.every((d) => d.users === 0) ? (
            <div className="empty-state" style={{ minHeight: 220 }}>
              <p>No user registration data yet.</p>
            </div>
          ) : (
            <UserGrowthChart data={userGrowthData} />
          )}
        </div>

        {/* Sessions Bar Chart */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Bookings &amp; Sessions by Day</p>
              <p className="chart-card__subtitle">Last 30 days · Mon–Sun</p>
            </div>
          </div>
          {sessionsBarData.every((d) => d.bookings === 0 && d.sessions === 0) ? (
            <div className="empty-state" style={{ minHeight: 220 }}>
              <p>No bookings or session data in the last 30 days.</p>
            </div>
          ) : (
            <SessionsBarChart data={sessionsBarData} />
          )}
        </div>

        {/* Payment Donut */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Payment Status Breakdown</p>
              <p className="chart-card__subtitle">All time · {totalPaymentsCount} total transactions</p>
            </div>
          </div>
          {totalPaymentsCount === 0 ? (
            <div className="empty-state" style={{ minHeight: 200 }}>
              <p>No payment data yet.</p>
            </div>
          ) : (
            <PaymentDonut
              completed={paymentDonutData.completed}
              pending={paymentDonutData.pending}
              failed={paymentDonutData.failed}
              refunded={paymentDonutData.refunded}
            />
          )}
        </div>
      </div>

      {/* ── Chart Row 2 — 3 col ───────────────────────────────────────────── */}
      <div className="chart-grid chart-grid--3col">

        {/* Community Activity */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Community Activity</p>
              <p className="chart-card__subtitle">Posts · last 6 weeks</p>
            </div>
          </div>
          {communityChartData.every((d) => d.posts === 0) ? (
            <div className="empty-state" style={{ minHeight: 180 }}>
              <p>No community posts in the last 6 weeks.</p>
            </div>
          ) : (
            <CommunityChart data={communityChartData} />
          )}
        </div>

        {/* Top Domains */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Top Domains</p>
              <p className="chart-card__subtitle">By community post volume</p>
            </div>
          </div>
          {topDomains.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 140 }}>
              <p>No domain data available.</p>
            </div>
          ) : (
            <table className="mini-table">
              <tbody>
                {topDomains.map(([domain, count], idx) => (
                  <tr key={domain}>
                    <td style={{ width: 20, color: 'var(--clr-text-subtle)', fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td style={{ fontWeight: 500 }}>{domain}</td>
                    <td style={{ width: 80 }}>
                      <div className="mini-bar">
                        <div
                          className="mini-bar-fill"
                          style={{ width: `${Math.round((count / maxDomainCount) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td style={{ width: 30, textAlign: 'right', color: 'var(--clr-text-muted)', fontWeight: 600 }}>
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Guides */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Top Guides</p>
              <p className="chart-card__subtitle">By total sessions completed</p>
            </div>
          </div>
          {topGuides.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 140 }}>
              <p>No guides available.</p>
            </div>
          ) : (
            <table className="mini-table">
              <tbody>
                {topGuides.map((g, idx) => (
                  <tr key={idx}>
                    <td style={{ width: 20, color: 'var(--clr-text-subtle)', fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td style={{ fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.name || '—'}
                    </td>
                    <td style={{ width: 48, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                      {g.totalSessions ?? 0} <span style={{ fontSize: '0.7rem' }}>sess</span>
                    </td>
                    <td style={{ width: 56, textAlign: 'right' }}>
                      {g.rating != null ? (
                        <span
                          className="badge badge-success"
                          style={{ fontSize: '0.7rem', padding: '1px 6px' }}
                        >
                          ★ {g.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Row 3 — Activity Feed + Platform Health ───────────────────────── */}
      <div className="chart-grid chart-grid--2col">

        {/* Recent Activity Feed */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Recent Activity</p>
              <p className="chart-card__subtitle">Latest user &amp; payment events</p>
            </div>
            <Activity size={16} color="var(--clr-text-subtle)" />
          </div>
          {activityItems.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 160 }}>
              <p>No recent activity.</p>
            </div>
          ) : (
            <div className="activity-feed">
              {activityItems.map((item) => (
                <div key={item.id} className="activity-item">
                  <div
                    className="activity-dot"
                    style={{ background: item.dotBg, color: item.dotColor }}
                  >
                    {item.type === 'user' ? (
                      <UserPlus size={14} />
                    ) : (
                      <CreditCard size={14} />
                    )}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{item.text}</p>
                    <p className="activity-time">{formatDate(item.ts)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Health */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Platform Health</p>
              <p className="chart-card__subtitle">Key operational metrics</p>
            </div>
          </div>

          {/* Three progress rings */}
          <div className="health-grid" style={{ marginBottom: 'var(--sp-5)' }}>
            <div className="health-item">
              <ProgressRing
                value={paymentSuccessRate}
                size={76}
                stroke={7}
                color="#10B981"
                label="Payment Success"
              />
            </div>
            <div className="health-item">
              <ProgressRing
                value={activeGuidesRate}
                size={76}
                stroke={7}
                color="#8B5CF6"
                label="Active Guides"
              />
            </div>
            <div className="health-item">
              <ProgressRing
                value={bookingFillRate}
                size={76}
                stroke={7}
                color="#2563EB"
                label="Booking Fill Rate"
              />
            </div>
          </div>

          {/* Status badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--sp-3)',
              alignItems: 'center',
              paddingTop: 'var(--sp-4)',
              borderTop: '1px solid var(--clr-border)',
            }}
          >
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Wifi size={10} />
              Uptime 99.9%
            </span>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Wifi size={10} />
              Live Database
            </span>
            <span
              className="badge badge-neutral"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}
            >
              <Clock size={10} />
              {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
