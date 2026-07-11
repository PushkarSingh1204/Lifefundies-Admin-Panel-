import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../components/Toast';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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
import {
  Users as UsersIcon,
  Shield,
  Ban,
  CheckCircle,
  Download,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserRecord {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  joinedAt: string;
  sessionCount: number;
  isSuspended: boolean;
  status: string;
  [key: string]: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a Firestore Timestamp, Date, or ISO string → "Jul 8, 2026" */
function formatDate(raw: unknown): string {
  if (!raw) return '—';
  let d: Date;
  if (
    raw &&
    typeof raw === 'object' &&
    'toDate' in raw &&
    typeof (raw as { toDate: () => Date }).toDate === 'function'
  ) {
    d = (raw as { toDate: () => Date }).toDate();
  } else if (raw instanceof Date) {
    d = raw;
  } else {
    d = new Date(raw as string);
  }
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Convert Firestore value to ISO string for sort comparisons */
function toISOForSort(raw: unknown): string {
  if (!raw) return '';
  if (
    raw &&
    typeof raw === 'object' &&
    'toDate' in raw &&
    typeof (raw as { toDate: () => Date }).toDate === 'function'
  ) {
    return (raw as { toDate: () => Date }).toDate().toISOString();
  }
  if (raw instanceof Date) return raw.toISOString();
  return String(raw);
}



// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <span
        className="badge badge-danger"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <Shield size={11} />
        <span>Admin</span>
      </span>
    );
  }
  if (role === 'mentor') {
    return <span className="badge badge-primary">Mentor</span>;
  }
  return <span className="badge badge-neutral">Student</span>;
}

function StatusBadge({ suspended }: { suspended: boolean }) {
  return suspended ? (
    <span className="badge badge-danger">Suspended</span>
  ) : (
    <span className="badge badge-success">Active</span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Users: React.FC = () => {
  const { showToast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search: raw input → debounced query
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);

  // Confirm dialogs
  const [suspendTarget, setSuspendTarget] = useState<UserRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Debounce search ────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter]);

  // ── Firestore real-time ────────────────────────────────────────────────────

  useEffect(() => {
    if (!db) return;
    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const suspended =
            data.isSuspended === true || data.status === 'suspended';
          return {
            uid: docSnap.id,
            displayName: data.displayName || 'Anonymous User',
            email: data.email || '',
            role: data.role || 'student',
            joinedAt: toISOForSort(data.joinedAt || data.createdAt || null),
            sessionCount: Number(data.sessionCount ?? 0),
            isSuspended: suspended,
            status: suspended ? 'suspended' : 'active',
          };
        });
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore users fetch failed:', err);
        showToast('Failed to fetch live users.', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !u.isSuspended) ||
        (statusFilter === 'suspended' && u.isSuspended);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // ── Sort ───────────────────────────────────────────────────────────────────

  const { sorted, sortKey, sortDir, requestSort } =
    useSortableData<UserRecord>(filtered);

  // ── Paginate ───────────────────────────────────────────────────────────────

  const pageSlice = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  // ── CSV Export ─────────────────────────────────────────────────────────────

  const handleExport = () => {
    const rows = sorted.map((u) => ({
      Name: u.displayName,
      Email: u.email,
      Role: u.role,
      Joined: formatDate(u.joinedAt),
      Sessions: u.sessionCount,
      Status: u.isSuspended ? 'Suspended' : 'Active',
    }));
    exportToCSV('users_export.csv', rows);
    showToast(`Exported ${rows.length} users to CSV.`, 'success');
  };

  // ── Suspend / Activate ─────────────────────────────────────────────────────

  const handleConfirmSuspend = async () => {
    if (!suspendTarget || !db) return;
    setActionLoading(true);
    try {
      const nextSuspended = !suspendTarget.isSuspended;
      await updateDoc(doc(db, 'users', suspendTarget.uid), {
        isSuspended: nextSuspended,
        status: nextSuspended ? 'suspended' : 'active',
      });
      showToast(
        `${suspendTarget.displayName} has been ${nextSuspended ? 'suspended' : 'activated'}.`,
        'success'
      );
      setSuspendTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed.';
      console.error('Error toggling user status:', err);
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };



  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="animate-fadeIn"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}
    >
      {/* ── Page Header ── */}
      <PageHeader
        title="Users"
        subtitle="Manage registered user accounts, roles, and account status."
        badge={
          <span className="badge badge-neutral">
            {loading ? '—' : filtered.length} users
          </span>
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

      {/* ── Search + Filters ── */}
      <SearchFilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        placeholder="Search by name or email address…"
        filters={
          <>
            <select
              className="filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </>
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

      {/* ── Content ── */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <UsersIcon size={40} className="empty-icon" />
          <h3>No users found</h3>
          <p>
            There are no registered users matching your current search and
            filter criteria.
          </p>
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
                <SortableTh
                  label="Name"
                  sortKey="displayName"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('displayName')}
                />
                <SortableTh
                  label="Role"
                  sortKey="role"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('role')}
                />
                <SortableTh
                  label="Joined"
                  sortKey="joinedAt"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('joinedAt')}
                />
                <SortableTh
                  label="Sessions"
                  sortKey="sessionCount"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('sessionCount')}
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
              {pageSlice.map((user) => (
                <tr key={user.uid}>
                  {/* Name + email stacked */}
                  <td>
                    <div style={{ fontWeight: 600, lineHeight: 1.3 }}>
                      {user.displayName}
                    </div>
                    <div
                      className="body-sm text-muted"
                      style={{ fontSize: '0.75rem', marginTop: 2 }}
                    >
                      {user.email || '—'}
                    </div>
                  </td>

                  {/* Role */}
                  <td>
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Joined */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {formatDate(user.joinedAt)}
                  </td>

                  {/* Sessions */}
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {user.sessionCount}
                  </td>

                  {/* Status */}
                  <td>
                    <StatusBadge suspended={user.isSuspended} />
                  </td>

                  {/* Actions */}
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--sp-2)',
                        flexWrap: 'nowrap',
                      }}
                    >
                      {/* Suspend / Activate */}
                      <button
                        className="btn btn-outline"
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          color: user.isSuspended
                            ? 'var(--clr-success)'
                            : 'var(--clr-danger)',
                          borderColor: user.isSuspended
                            ? 'rgba(34,197,94,0.25)'
                            : 'rgba(239,68,68,0.25)',
                        }}
                        onClick={() => setSuspendTarget(user)}
                      >
                        {user.isSuspended ? (
                          <CheckCircle size={12} />
                        ) : (
                          <Ban size={12} />
                        )}
                        <span>{user.isSuspended ? 'Activate' : 'Suspend'}</span>
                      </button>


                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}

      {/* ── Confirm: Suspend / Activate ── */}
      <ConfirmDialog
        isOpen={suspendTarget !== null}
        variant="danger"
        loading={actionLoading}
        title={
          suspendTarget?.isSuspended
            ? 'Activate User Account'
            : 'Suspend User Account'
        }
        message={
          suspendTarget?.isSuspended
            ? `Are you sure you want to re-activate ${suspendTarget?.displayName}'s account? They will regain full access to the platform immediately.`
            : `Are you sure you want to suspend ${suspendTarget?.displayName}'s account? This will block their access to the platform until the account is re-activated.`
        }
        confirmLabel={
          suspendTarget?.isSuspended ? 'Yes, Activate' : 'Yes, Suspend'
        }
        cancelLabel="Cancel"
        onConfirm={handleConfirmSuspend}
        onCancel={() => {
          if (!actionLoading) setSuspendTarget(null);
        }}
      />


    </div>
  );
};

export default Users;

