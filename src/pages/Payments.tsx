import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../components/Toast';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import {
  CreditCard,
  Download,
  RotateCcw,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import {
  PageHeader,
  SearchFilterBar,
  TableWrapper,
  Pagination,
  exportToCSV,
  useSortableData,
  SortableTh,
} from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeleton';
import { KpiCard } from '../components/KpiCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Payment {
  paymentId: string;
  bookingId?: string;
  userName?: string;
  userId?: string;
  amount?: number;
  currency?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded' | string;
  createdAt: Date | null;
  refundedAt?: Date | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function toDateOnly(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <span className="badge badge-success">Completed</span>;
    case 'pending':
      return <span className="badge badge-warning">Pending</span>;
    case 'failed':
      return <span className="badge badge-danger">Failed</span>;
    case 'refunded':
      return <span className="badge badge-neutral">Refunded</span>;
    default:
      return <span className="badge badge-neutral">{status}</span>;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const Payments: React.FC = () => {
  const { showToast } = useToast();

  // ---- Raw data ----------------------------------------------------------
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Filters -----------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ---- Pagination --------------------------------------------------------
  const [page, setPage] = useState(1);

  // ---- Refund dialog -----------------------------------------------------
  const [refundTarget, setRefundTarget] = useState<string | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);

  // ---- Firestore live subscription ---------------------------------------
  useEffect(() => {
    if (!db) return;
    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, 'payments'),
      (snapshot) => {
        const list: Payment[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            paymentId: docSnap.id,
            bookingId: data.bookingId ?? '',
            userName: data.userName ?? '',
            userId: data.userId ?? '',
            amount: typeof data.amount === 'number' ? data.amount : 0,
            currency: data.currency ?? 'INR',
            status: data.status ?? 'pending',
            createdAt:
              data.createdAt?.toDate?.() ??
              (data.createdAt ? new Date(data.createdAt) : null),
            refundedAt: data.refundedAt?.toDate?.() ?? null,
          };
        });

        // Default sort: newest first
        list.sort((a, b) => {
          const aT = a.createdAt?.getTime() ?? 0;
          const bT = b.createdAt?.getTime() ?? 0;
          return bT - aT;
        });

        setPayments(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore payments subscription error:', err);
        showToast('Failed to load live payments data.', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- KPI derivations ---------------------------------------------------
  const kpis = useMemo(() => {
    const completed = payments.filter((p) => p.status === 'completed');
    const pending = payments.filter((p) => p.status === 'pending');
    const refunded = payments.filter((p) => p.status === 'refunded');
    const totalRevenue = completed.reduce((acc, p) => acc + (p.amount ?? 0), 0);
    return {
      totalRevenue,
      successCount: completed.length,
      pendingCount: pending.length,
      refundCount: refunded.length,
    };
  }, [payments]);

  // ---- Filter pipeline ---------------------------------------------------
  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const fromTs = dateFrom ? toDateOnly(new Date(dateFrom)) : null;
    const toTs = dateTo ? toDateOnly(new Date(dateTo)) : null;

    return payments.filter((p) => {
      // Search across paymentId, bookingId, userName, userId
      if (query) {
        const haystack = [
          p.paymentId,
          p.bookingId ?? '',
          p.userName ?? '',
          p.userId ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      // Date range
      if (p.createdAt) {
        const ts = toDateOnly(p.createdAt);
        if (fromTs !== null && ts < fromTs) return false;
        if (toTs !== null && ts > toTs) return false;
      } else if (fromTs !== null || toTs !== null) {
        return false;
      }

      return true;
    });
  }, [payments, searchQuery, statusFilter, dateFrom, dateTo]);

  // ---- Sort --------------------------------------------------------------
  const { sorted, sortKey, sortDir, requestSort } = useSortableData<Payment>(filtered);

  // ---- Pagination slice --------------------------------------------------
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, dateFrom, dateTo]);

  // ---- CSV Export --------------------------------------------------------
  const handleExport = () => {
    if (!sorted.length) {
      showToast('No data available to export.', 'error');
      return;
    }
    const rows = sorted.map((p) => ({
      paymentId: p.paymentId,
      bookingId: p.bookingId ?? '',
      student: p.userName || p.userId || '',
      amount: p.amount ?? 0,
      currency: p.currency ?? 'INR',
      status: p.status,
      createdAt: formatDate(p.createdAt),
    }));
    exportToCSV('payments_export.csv', rows);
    showToast('Payments exported to payments_export.csv', 'success');
  };

  // ---- Refund handlers ---------------------------------------------------
  const openRefundDialog = (paymentId: string) => setRefundTarget(paymentId);
  const closeRefundDialog = () => {
    if (!refundLoading) setRefundTarget(null);
  };

  const handleConfirmRefund = async () => {
    if (!refundTarget || !db) return;
    setRefundLoading(true);
    try {
      await updateDoc(doc(db, 'payments', refundTarget), {
        status: 'refunded',
        refundedAt: new Date(),
      });
      showToast('Payment has been marked as refunded.', 'success');
      setRefundTarget(null);
    } catch (err: any) {
      console.error('Refund error:', err);
      showToast(err.message || 'Failed to issue refund. Please try again.', 'error');
    } finally {
      setRefundLoading(false);
    }
  };

  // ---- Render ------------------------------------------------------------
  return (
    <div
      className="animate-fadeIn"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Page Header                                                       */}
      {/* ---------------------------------------------------------------- */}
      <PageHeader
        title="Payments & Revenue"
        subtitle="Monitor all platform financial transactions"
        badge={
          <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
            {loading ? '…' : `${payments.length} records`}
          </span>
        }
        actions={
          <button
            className="btn-export"
            onClick={handleExport}
            disabled={loading}
          >
            <Download size={14} />
            Export CSV
          </button>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* KPI Cards — 4 columns                                            */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="kpi-grid"
        style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
      >
        <KpiCard
          title="Total Revenue"
          value={kpis.totalRevenue}
          format="currency"
          prefix="₹"
          icon={<DollarSign size={20} />}
          iconBg="rgba(37, 99, 235, 0.10)"
          iconColor="var(--clr-primary)"
          loading={loading}
        />
        <KpiCard
          title="Successful Payments"
          value={kpis.successCount}
          icon={<TrendingUp size={20} />}
          iconBg="rgba(16, 185, 129, 0.10)"
          iconColor="var(--clr-success)"
          loading={loading}
        />
        <KpiCard
          title="Pending Payments"
          value={kpis.pendingCount}
          icon={<CreditCard size={20} />}
          iconBg="rgba(245, 158, 11, 0.10)"
          iconColor="var(--clr-warning)"
          loading={loading}
        />
        <KpiCard
          title="Refunds Issued"
          value={kpis.refundCount}
          icon={<RotateCcw size={20} />}
          iconBg="rgba(239, 68, 68, 0.10)"
          iconColor="var(--clr-danger)"
          loading={loading}
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Search + Filters                                                  */}
      {/* ---------------------------------------------------------------- */}
      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={(v) => setSearchQuery(v)}
        placeholder="Search by transaction ID, booking ID, student name or user ID…"
        filters={
          <>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', minWidth: 144 }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="From date"
            />

            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', minWidth: 144 }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="To date"
            />
          </>
        }
        actions={
          <button
            className="btn-export"
            onClick={handleExport}
            disabled={loading}
          >
            <Download size={14} />
            CSV
          </button>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* Table / Skeleton / Empty state                                    */}
      {/* ---------------------------------------------------------------- */}
      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <CreditCard size={44} className="empty-icon" />
          <h3 style={{ marginBottom: 'var(--sp-2)' }}>No payments found</h3>
          <p>
            No financial transactions match your current search and filter
            criteria.
          </p>
        </div>
      ) : (
        <TableWrapper
          footer={
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={sorted.length}
              onPageChange={(p) => setPage(p)}
            />
          }
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Booking ID</th>
                <th>Student</th>
                <SortableTh
                  label="Amount"
                  sortKey="amount"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('amount')}
                />
                <SortableTh
                  label="Date"
                  sortKey="createdAt"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('createdAt')}
                />
                <SortableTh
                  label="Status"
                  sortKey="status"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('status')}
                />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.paymentId}>
                  {/* Transaction ID — first 16 chars */}
                  <td>
                    <span
                      className="text-mono"
                      style={{ fontWeight: 600 }}
                      title={p.paymentId}
                    >
                      {p.paymentId.length > 16
                        ? `${p.paymentId.slice(0, 16)}…`
                        : p.paymentId}
                    </span>
                  </td>

                  {/* Booking ID — first 12 chars */}
                  <td>
                    <span
                      className="text-mono"
                      style={{ color: 'var(--clr-text-muted)' }}
                      title={p.bookingId}
                    >
                      {(p.bookingId ?? '').length > 12
                        ? `${(p.bookingId ?? '').slice(0, 12)}…`
                        : p.bookingId || '—'}
                    </span>
                  </td>

                  {/* Student */}
                  <td>{p.userName || p.userId || '—'}</td>

                  {/* Amount */}
                  <td>
                    <strong>₹{(p.amount ?? 0).toLocaleString('en-IN')}</strong>
                  </td>

                  {/* Date */}
                  <td
                    style={{
                      color: 'var(--clr-text-muted)',
                      whiteSpace: 'nowrap',
                      fontSize: '0.82rem',
                    }}
                  >
                    {formatDate(p.createdAt)}
                  </td>

                  {/* Status */}
                  <td>{getStatusBadge(p.status)}</td>

                  {/* Actions */}
                  <td>
                    {p.status === 'completed' && (
                      <button
                        className="btn btn-outline"
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          color: 'var(--clr-warning)',
                          borderColor: 'rgba(245, 158, 11, 0.30)',
                          gap: 'var(--sp-1)',
                        }}
                        onClick={() => openRefundDialog(p.paymentId)}
                      >
                        <RotateCcw size={12} />
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Refund Confirm Dialog                                             */}
      {/* ---------------------------------------------------------------- */}
      <ConfirmDialog
        isOpen={refundTarget !== null}
        variant="warning"
        title="Issue Refund"
        message="This action will mark the payment as refunded. The student's payment record will be updated immediately and this action cannot be undone."
        confirmLabel="Yes, Issue Refund"
        cancelLabel="Cancel"
        loading={refundLoading}
        onConfirm={handleConfirmRefund}
        onCancel={closeRefundDialog}
      />
    </div>
  );
};

export default Payments;
