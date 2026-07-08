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
import { Activity, Download } from 'lucide-react';

const PAGE_SIZE = 20;



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

type SessionStatus = 'active' | 'scheduled' | 'completed' | 'cancelled';

const STATUS_BADGE: Record<SessionStatus | string, string> = {
  active: 'badge-success',
  scheduled: 'badge-primary',
  completed: 'badge-neutral',
  cancelled: 'badge-danger',
};

export const Sessions: React.FC = () => {
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // ── Real-time listener ──────────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'sessions'),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return { sessionId: docSnap.id, ...data };
        });
        setSessions(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore sessions fetch failed:', err);
        showToast('Failed to fetch sessions.', 'error');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── Filter ──────────────────────────────────────────────────────────────
  const filtered = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (s.userId || '').toLowerCase().includes(q) ||
      (s.guideId || '').toLowerCase().includes(q) ||
      (s.sessionId || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Sort ────────────────────────────────────────────────────────────────
  const { sorted, sortKey, sortDir, requestSort } = useSortableData<any>(filtered);

  // ── Reset page when filters change ─────────────────────────────────────
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  // ── Paginate ────────────────────────────────────────────────────────────
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── CSV export ──────────────────────────────────────────────────────────
  const handleExport = () => {
    exportToCSV(
      'sessions.csv',
      sorted.map((s) => ({
        sessionId: s.sessionId,
        userId: s.userId || '',
        guideId: s.guideId || '',
        startedAt: formatDateTime(s.startedAt ?? s.createdAt),
        duration: s.duration ?? '',
        status: s.status || '',
        notes: s.notes || '',
      }))
    );
  };

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <PageHeader
        title="Active Sessions"
        subtitle="Monitor all counseling sessions across the platform"
        badge={
          <span className="badge badge-neutral">
            {loading ? '—' : filtered.length} sessions
          </span>
        }
        actions={
          <button className="btn-export" onClick={handleExport}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        }
      />

      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={(v) => setSearchQuery(v)}
        placeholder="Search by Session ID, Student ID, or Guide ID…"
        filters={
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        }
        actions={
          <button
            className="btn-export"
            onClick={handleExport}
            disabled={loading || sorted.length === 0}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        }
      />

      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <Activity size={40} className="empty-icon" />
          <h3>No sessions found</h3>
          <p>No counseling sessions match your current search and filter criteria.</p>
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
                <th>Session ID</th>
                <th>Student</th>
                <th>Guide</th>
                <SortableTh
                  label="Started At"
                  sortKey="createdAt"
                  currentSortKey={sortKey as string}
                  sortDir={sortDir}
                  onSort={() => requestSort('createdAt')}
                />
                <th>Duration</th>
                <SortableTh
                  label="Status"
                  sortKey="status"
                  currentSortKey={sortKey as string}
                  sortDir={sortDir}
                  onSort={() => requestSort('status')}
                />
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => (
                <tr key={s.sessionId}>
                  {/* Session ID */}
                  <td>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--clr-text-muted)',
                      }}
                    >
                      {s.sessionId}
                    </span>
                  </td>

                  {/* Student */}
                  <td style={{ fontSize: '0.85rem' }}>{s.userId || '—'}</td>

                  {/* Guide */}
                  <td style={{ fontSize: '0.85rem' }}>{s.guideId || '—'}</td>

                  {/* Started At */}
                  <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {formatDateTime(s.startedAt ?? s.createdAt)}
                  </td>

                  {/* Duration */}
                  <td style={{ fontSize: '0.84rem' }}>
                    {s.duration != null ? `${s.duration} min` : '—'}
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`badge ${STATUS_BADGE[s.status as SessionStatus] ?? 'badge-neutral'}`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {s.status || '—'}
                    </span>
                  </td>

                  {/* Notes */}
                  <td style={{ maxWidth: 220 }}>
                    {s.notes ? (
                      <div
                        className="truncate-2"
                        style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', lineHeight: 1.4 }}
                      >
                        {s.notes}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--clr-text-subtle)', fontSize: '0.8rem' }}>—</span>
                    )}
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

export default Sessions;
