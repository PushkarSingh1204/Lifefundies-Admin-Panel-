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
  GraduationCap,
  Star,
  Download,
  Power,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MentorRecord {
  uid: string;
  displayName: string;
  bio: string;
  email: string;
  expertise: string[];
  experience: number;
  price: number;
  rating: number;
  totalSessions: number;
  isActive: boolean;
  [key: string]: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Component ────────────────────────────────────────────────────────────────

export const Mentors: React.FC = () => {
  const { showToast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────

  const [mentors, setMentors] = useState<MentorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);

  // Modals & Action Dialogs

  const [statusTarget, setStatusTarget] = useState<MentorRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Reset page on filter changes ───────────────────────────────────────────

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  // ── Firestore real-time listener ───────────────────────────────────────────

  useEffect(() => {
    if (!db) return;
    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, 'guides'),
      (snapshot) => {
        const list: MentorRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const exp = Number(data.experience ?? data.yearsOfExperience ?? 0);
          const priceVal = Number(data.pricePerSession ?? data.sessionPrice ?? data.price ?? 399);
          
          return {
            uid: docSnap.id,
            displayName: data.displayName || data.name || 'Unnamed Mentor',
            bio: data.bio || '',
            email: data.email || '',
            expertise: Array.isArray(data.expertise) ? data.expertise : [],
            experience: exp,
            price: priceVal,
            rating: Number(data.rating ?? 5.0),
            totalSessions: Number(data.totalSessions ?? 0),
            isActive: data.isActive !== false, // default to true if undefined
          };
        });
        setMentors(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore guides fetch failed:', err);
        showToast('Failed to fetch live mentors.', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return mentors.filter((m) => {
      // Search: Name, bio, email, or expertise
      const matchSearch =
        !q ||
        m.displayName.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.expertise.some((exp) => exp.toLowerCase().includes(q));

      // Status filter
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && m.isActive) ||
        (statusFilter === 'inactive' && !m.isActive);

      return matchSearch && matchStatus;
    });
  }, [mentors, searchQuery, statusFilter]);

  // ── Sort ───────────────────────────────────────────────────────────────────

  const { sorted, sortKey, sortDir, requestSort } =
    useSortableData<MentorRecord>(filtered);

  // ── Paginate ───────────────────────────────────────────────────────────────

  const pageSlice = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  // ── CSV Export ─────────────────────────────────────────────────────────────

  const handleExport = () => {
    const rows = sorted.map((m) => ({
      Name: m.displayName,
      Email: m.email,
      Bio: m.bio.replace(/\n/g, ' '),
      Expertise: m.expertise.join('; '),
      Experience: `${m.experience} years`,
      Price: `INR ${m.price}`,
      Rating: m.rating,
      Sessions: m.totalSessions,
      Status: m.isActive ? 'Active' : 'Inactive',
    }));
    exportToCSV('mentors_export.csv', rows);
    showToast(`Exported ${rows.length} mentors to CSV.`, 'success');
  };



  // ── Toggle Active Status ───────────────────────────────────────────────────

  const handleConfirmToggleActive = async () => {
    if (!statusTarget || !db) return;
    setActionLoading(true);
    try {
      const nextActive = !statusTarget.isActive;
      const guideRef = doc(db, 'guides', statusTarget.uid);
      await updateDoc(guideRef, {
        isActive: nextActive,
      });
      // Synchronize to users collection
      const userRef = doc(db, 'users', statusTarget.uid);
      await updateDoc(userRef, {
        isActive: nextActive,
      });
      showToast(
        `${statusTarget.displayName} profile status set to ${nextActive ? 'Active' : 'Inactive'}.`,
        'success'
      );
      setStatusTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed.';
      console.error('Error toggling active status:', err);
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
        title="Verified Mentors"
        subtitle="Manage registered platform mentors, adjust single session rates, and toggle availability."
        badge={
          <span className="badge badge-neutral">
            {loading ? '—' : filtered.length} mentors
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
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by mentor name, email, bio, or expertise domain…"
        filters={
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Mentors</option>
            <option value="active">Active Status</option>
            <option value="inactive">Inactive Status</option>
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

      {/* ── Content ── */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <GraduationCap size={40} className="empty-icon" />
          <h3>No mentors found</h3>
          <p>
            There are no mentors matching your current search and filter criteria.
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
                  label="Mentor Profile"
                  sortKey="displayName"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('displayName')}
                />
                <th>Expertise Areas</th>
                <SortableTh
                  label="Experience"
                  sortKey="experience"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('experience')}
                />
                <SortableTh
                  label="Session Price"
                  sortKey="price"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('price')}
                />
                <SortableTh
                  label="Rating & Stats"
                  sortKey="rating"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('rating')}
                />
                <SortableTh
                  label="Status"
                  sortKey="isActive"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('isActive')}
                />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((mentor) => {
                // Shorten bio for clean view
                const bioSnippet = mentor.bio || 'No bio description provided.';

                return (
                  <tr key={mentor.uid}>
                    {/* Profile */}
                    <td>
                      <div style={{ fontWeight: 600 }}>{mentor.displayName}</div>
                      <div
                        className="body-sm text-muted truncate-1"
                        style={{ fontSize: '0.75rem', marginTop: 2, maxWidth: 280 }}
                        title={bioSnippet}
                      >
                        {bioSnippet}
                      </div>
                    </td>

                    {/* Expertise Areas */}
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 220 }}>
                        {mentor.expertise.length > 0 ? (
                          <>
                            {mentor.expertise.slice(0, 2).map((exp) => (
                              <span
                                key={exp}
                                className="badge badge-primary"
                                style={{ fontSize: '0.65rem', padding: '1px 6px' }}
                              >
                                {exp}
                              </span>
                            ))}
                            {mentor.expertise.length > 2 && (
                              <span
                                className="badge badge-neutral"
                                style={{ fontSize: '0.65rem', padding: '1px 6px' }}
                                title={mentor.expertise.slice(2).join(', ')}
                              >
                                +{mentor.expertise.length - 2} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                            N/A
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Experience */}
                    <td>{mentor.experience} yrs</td>

                    {/* Pricing */}
                    <td style={{ fontWeight: 600 }}>₹{mentor.price}</td>

                    {/* Rating & Stats */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <Star size={12} fill="#F59E0B" color="#F59E0B" />
                        <span>{mentor.rating.toFixed(1)}</span>
                        <span className="body-sm text-muted" style={{ fontWeight: 400, fontSize: '0.72rem' }}>
                          ({mentor.totalSessions} sessions)
                        </span>
                      </div>
                    </td>

                    {/* Active Status */}
                    <td>
                      {mentor.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-neutral">Inactive</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'nowrap' }}>


                        {/* Toggle active profile */}
                        <button
                          className="btn btn-outline"
                          style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            color: mentor.isActive ? 'var(--clr-danger)' : 'var(--clr-success)',
                            borderColor: mentor.isActive ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)',
                          }}
                          onClick={() => setStatusTarget(mentor)}
                        >
                          <Power size={12} />
                          <span>{mentor.isActive ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrapper>
      )}



      {/* ── Confirm: Toggle Active Status ── */}
      <ConfirmDialog
        isOpen={statusTarget !== null}
        variant={statusTarget?.isActive ? 'danger' : 'warning'}
        loading={actionLoading}
        title={statusTarget?.isActive ? 'Deactivate Mentor Profile' : 'Activate Mentor Profile'}
        message={
          statusTarget?.isActive
            ? `Are you sure you want to deactivate ${statusTarget.displayName}'s mentor profile? They will no longer show up on the public explore page or receive new bookings.`
            : `Are you sure you want to activate ${statusTarget?.displayName}'s mentor profile? They will immediately be visible on the explore page and open to receiving bookings.`
        }
        confirmLabel={statusTarget?.isActive ? 'Deactivate' : 'Activate'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmToggleActive}
        onCancel={() => {
          if (!actionLoading) setStatusTarget(null);
        }}
      />
    </div>
  );
};

export default Mentors;
