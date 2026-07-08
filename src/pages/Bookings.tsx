import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  PageHeader,
  SearchFilterBar,
  TableWrapper,
  Pagination,
  exportToCSV,
  useSortableData,
  SortableTh,
} from '../components/DataTable';
import { SkeletonTable } from '../components/Skeleton';
import { CalendarDays, Clock, User } from 'lucide-react';

const PAGE_SIZE = 20;

const formatDate = (ts: any) => {
  if (!ts) return 'N/A';
  const d = ts?.toDate?.() ?? new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateTime = (ts: any) => {
  if (!ts) return 'N/A';
  const d = ts?.toDate?.() ?? new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-primary',
  cancelled: 'badge-danger',
  completed: 'badge-success',
};

export const Bookings: React.FC = () => {
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // ── Real-time listener ──────────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return { bookingId: docSnap.id, ...data };
        });
        setBookings(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore bookings fetch failed:', err);
        showToast('Failed to fetch bookings.', 'error');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── Filter ──────────────────────────────────────────────────────────────
  const filtered = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (b.userId || '').toLowerCase().includes(q) ||
      (b.guideId || '').toLowerCase().includes(q) ||
      (b.bookingId || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    // Date range filter on sessionDate
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const sessionDate: Date = b.sessionDate?.toDate?.() ?? (b.sessionDate ? new Date(b.sessionDate) : null);
      if (!sessionDate) {
        matchesDate = false;
      } else {
        if (dateFrom) matchesDate = matchesDate && sessionDate >= new Date(dateFrom);
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && sessionDate <= toDate;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // ── Sort ────────────────────────────────────────────────────────────────
  const { sorted, sortKey, sortDir, requestSort } = useSortableData<any>(filtered);

  // ── Reset page when filters change ─────────────────────────────────────
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter, dateFrom, dateTo]);

  // ── Paginate ────────────────────────────────────────────────────────────
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── CSV export ──────────────────────────────────────────────────────────
  const handleExport = () => {
    exportToCSV(
      'bookings.csv',
      sorted.map((b) => ({
        bookingId: b.bookingId,
        userId: b.userId || '',
        guideId: b.guideId || '',
        sessionDate: formatDateTime(b.sessionDate),
        duration: b.duration ?? '',
        status: b.status || '',
        createdAt: formatDate(b.createdAt),
      }))
    );
  };

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <PageHeader
        title="Session Bookings"
        subtitle="View and monitor all platform session bookings"
        actions={
          <button className="btn btn-outline" onClick={handleExport} style={{ fontSize: '0.85rem' }}>
            Export CSV
          </button>
        }
      />

      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={(v) => setSearchQuery(v)}
        placeholder="Search by Booking ID, Student ID, or Guide ID…"
        filters={
          <>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>

            {/* Date from */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={14} style={{ color: 'var(--clr-text-subtle)', flexShrink: 0 }} />
              <input
                type="date"
                className="filter-select"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="Session date from"
                style={{ minWidth: 130 }}
              />
            </div>

            {/* Date to */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-subtle)', whiteSpace: 'nowrap' }}>to</span>
              <input
                type="date"
                className="filter-select"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="Session date to"
                style={{ minWidth: 130 }}
              />
            </div>
          </>
        }
      />

      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={40} className="empty-icon" />
          <h3>No bookings found</h3>
          <p>No session bookings match your current search and filter criteria.</p>
        </div>
      ) : (
        <TableWrapper
          footer={
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={sorted.length}
              onPageChange={setPage}
            />
          }
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <User size={13} />
                    Student
                  </span>
                </th>
                <th>Guide</th>
                <SortableTh
                  label="Session Date & Time"
                  sortKey="sessionDate"
                  currentSortKey={sortKey as string}
                  sortDir={sortDir}
                  onSort={() => requestSort('sessionDate')}
                />
                <th>Duration</th>
                <SortableTh
                  label="Status"
                  sortKey="status"
                  currentSortKey={sortKey as string}
                  sortDir={sortDir}
                  onSort={() => requestSort('status')}
                />
                <SortableTh
                  label="Created At"
                  sortKey="createdAt"
                  currentSortKey={sortKey as string}
                  sortDir={sortDir}
                  onSort={() => requestSort('createdAt')}
                />
              </tr>
            </thead>
            <tbody>
              {paginated.map((b) => (
                <tr key={b.bookingId}>
                  {/* Booking ID */}
                  <td>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--clr-text-muted)',
                      }}
                    >
                      {b.bookingId}
                    </span>
                  </td>

                  {/* Student */}
                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text)' }}>{b.userId || '—'}</div>
                  </td>

                  {/* Guide */}
                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text)' }}>{b.guideId || '—'}</div>
                  </td>

                  {/* Session Date + Time */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem' }}>
                      <Clock size={13} style={{ color: 'var(--clr-text-subtle)', flexShrink: 0 }} />
                      {formatDateTime(b.sessionDate)}
                    </div>
                  </td>

                  {/* Duration */}
                  <td style={{ fontSize: '0.84rem' }}>
                    {b.duration != null ? `${b.duration} min` : '—'}
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`badge ${STATUS_BADGE[b.status] ?? 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                      {b.status || '—'}
                    </span>
                  </td>

                  {/* Created At */}
                  <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {formatDate(b.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
};

export default Bookings;
