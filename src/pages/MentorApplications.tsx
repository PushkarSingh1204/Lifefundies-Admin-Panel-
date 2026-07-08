import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../components/Toast';
import { db } from '../firebase/config';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  PageHeader,
  SearchFilterBar,
  TableWrapper,
  Pagination,
  exportToCSV,
  useSortableData,
  SortableTh,
} from '../components/DataTable';
import { Modal } from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import {
  ClipboardList,
  Eye,
  Check,
  X,
  Download,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApplicationRecord {
  uid: string;
  email: string;
  mentorApplicationStatus: 'pending' | 'info_requested' | 'rejected' | 'approved' | string;
  mentorApplication: {
    fullName?: string;
    phone?: string;
    bio?: string;
    experience?: string | number;
    qualification?: string;
    languages?: string[];
    expertise?: string[];
    [key: string]: unknown;
  } | null;
  submittedAt: Date | null;
  mentorReviewNote?: string;
  mentorReviewedAt?: Date | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <span className="badge badge-success">Approved</span>;
    case 'rejected':
      return <span className="badge badge-danger">Rejected</span>;
    case 'info_requested':
      return <span className="badge badge-warning">Info Requested</span>;
    case 'pending':
    default:
      return <span className="badge badge-primary">Pending</span>;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MentorApplications: React.FC = () => {
  const { showToast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);

  // Modal States
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'info'>('approve');
  const [actionNote, setActionNote] = useState('');
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
      collection(db, 'users'),
      (snapshot) => {
        const apps = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const subAt = data.mentorApplication?.submittedAt?.toDate?.() || 
                          (data.mentorApplication?.submittedAt ? new Date(data.mentorApplication.submittedAt) : null);
            return {
              uid: docSnap.id,
              email: data.email || '',
              mentorApplicationStatus: data.mentorApplicationStatus || 'none',
              mentorApplication: data.mentorApplication || null,
              submittedAt: subAt,
              mentorReviewNote: data.mentorReviewNote || '',
              mentorReviewedAt: data.mentorReviewedAt?.toDate?.() || null,
            };
          })
          .filter((app) =>
            ['pending', 'info_requested', 'rejected', 'approved'].includes(app.mentorApplicationStatus)
          );

        // Default sort: newest first
        apps.sort((a, b) => {
          const aTime = a.submittedAt ? a.submittedAt.getTime() : 0;
          const bTime = b.submittedAt ? b.submittedAt.getTime() : 0;
          return bTime - aTime;
        });

        setApplications(apps);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore applications fetch failed:', err);
        showToast('Failed to fetch live applications.', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return applications.filter((app) => {
      const details = app.mentorApplication || {};
      const name = (details.fullName || '').toLowerCase();
      const email = app.email.toLowerCase();

      const matchesSearch = !q || name.includes(q) || email.includes(q);
      const matchesStatus =
        statusFilter === 'all' || app.mentorApplicationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  // ── Sort ───────────────────────────────────────────────────────────────────

  const { sorted, sortKey, sortDir, requestSort } =
    useSortableData<ApplicationRecord>(filtered);

  // ── Paginate ───────────────────────────────────────────────────────────────

  const pageSlice = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  // ── CSV Export ─────────────────────────────────────────────────────────────

  const handleExport = () => {
    const rows = sorted.map((app) => {
      const details = app.mentorApplication || {};
      return {
        Name: details.fullName || 'Guide Applicant',
        Email: app.email,
        Experience: details.experience ? `${details.experience} years` : 'N/A',
        Qualification: details.qualification || '',
        Languages: details.languages?.join('; ') || '',
        Expertise: details.expertise?.join('; ') || '',
        Status: app.mentorApplicationStatus,
        SubmittedDate: formatDate(app.submittedAt),
        ReviewNote: app.mentorReviewNote || '',
      };
    });
    exportToCSV('mentor_applications.csv', rows);
    showToast(`Exported ${rows.length} applications to CSV.`, 'success');
  };

  // ── Perform Action ─────────────────────────────────────────────────────────

  const handlePerformAction = async () => {
    if (!selectedApp || !db) return;

    setActionLoading(true);
    try {
      const decision =
        actionType === 'approve'
          ? 'approved'
          : actionType === 'reject'
          ? 'rejected'
          : 'info_requested';

      // Update user document role and application status
      const userRef = doc(db, 'users', selectedApp.uid);
      const updates: Record<string, unknown> = {
        mentorApplicationStatus: decision,
        updatedAt: serverTimestamp(),
      };

      if (actionNote) {
        updates.mentorReviewNote = actionNote;
        updates.mentorReviewedAt = serverTimestamp();
      } else {
        // clear old review notes if blank
        updates.mentorReviewNote = '';
      }

      if (decision === 'approved') {
        updates.role = 'mentor';
      }

      await updateDoc(userRef, updates);

      // If approved, create guide profile in guides collection
      if (decision === 'approved') {
        const appDetails = selectedApp.mentorApplication || {};
        const guideRef = doc(db, 'guides', selectedApp.uid);
        const defaultExpertise = appDetails.expertise || [];

        await setDoc(
          guideRef,
          {
            uid: selectedApp.uid,
            guideId: selectedApp.uid,
            name: appDetails.fullName || 'Guide',
            displayName: appDetails.fullName || 'Guide',
            photoURL: '',
            bio: appDetails.bio || '',
            domains: defaultExpertise,
            domainIds: defaultExpertise,
            expertise: defaultExpertise,
            categories: ['peer-buddy'],
            price: 129,
            sessionPrice: 129,
            rating: 5.0,
            reviewCount: 0,
            totalSessions: 0,
            yearsOfExperience: Number(appDetails.experience) || 1,
            education: appDetails.qualification || '',
            qualification: appDetails.qualification || '',
            languages: appDetails.languages || ['Hindi', 'English'],
            isActive: true,
            isAvailable: true,
            isVerified: true,
            source: 'users',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      showToast(
        `Application successfully ${
          decision === 'approved'
            ? 'approved'
            : decision === 'rejected'
            ? 'rejected'
            : 'flagged for info'
        }.`,
        'success'
      );
      setIsActionModalOpen(false);
      setIsViewModalOpen(false);
      setActionNote('');
      setSelectedApp(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed.';
      console.error('Error performing application action:', err);
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (app: ApplicationRecord, type: 'approve' | 'reject' | 'info') => {
    setSelectedApp(app);
    setActionType(type);
    setIsActionModalOpen(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="animate-fadeIn"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}
    >
      {/* ── Page Header ── */}
      <PageHeader
        title="Mentor Applications"
        subtitle="Review and process applicant profiles to certify new platform mentors."
        badge={
          <span className="badge badge-neutral">
            {loading ? '—' : filtered.length} applications
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
        placeholder="Search applications by applicant name or email address…"
        filters={
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="info_requested">Info Requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
          <ClipboardList size={40} className="empty-icon" />
          <h3>No applications found</h3>
          <p>
            There are no applications matching your current search and filter criteria.
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
                  label="Applicant Name"
                  sortKey="email" // sorting by email or details
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('email')}
                />
                <th>Email</th>
                <th>Experience</th>
                <SortableTh
                  label="Submitted Date"
                  sortKey="submittedAt"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('submittedAt')}
                />
                <SortableTh
                  label="Status"
                  sortKey="mentorApplicationStatus"
                  currentSortKey={sortKey as string | null}
                  sortDir={sortDir}
                  onSort={() => requestSort('mentorApplicationStatus')}
                />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((app) => {
                const details = app.mentorApplication || {};
                const name = details.fullName || 'Guide Applicant';
                const exp = details.experience ? `${details.experience} years` : 'N/A';

                return (
                  <tr key={app.uid}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{name}</div>
                    </td>
                    <td>{app.email}</td>
                    <td>{exp}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(app.submittedAt)}</td>
                    <td>{getStatusBadge(app.mentorApplicationStatus)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'nowrap' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedApp(app);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye size={12} />
                          <span>View Details</span>
                        </button>

                        {app.mentorApplicationStatus === 'pending' && (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                backgroundColor: 'var(--clr-success)',
                              }}
                              onClick={() => openActionModal(app, 'approve')}
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                color: 'var(--clr-danger)',
                                borderColor: 'rgba(239, 68, 68, 0.25)',
                              }}
                              onClick={() => openActionModal(app, 'reject')}
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrapper>
      )}

      {/* ── View Details Modal ── */}
      {selectedApp && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            if (!actionLoading) {
              setIsViewModalOpen(false);
              setSelectedApp(null);
            }
          }}
          title="Mentor Application Profile"
          footer={
            <div style={{ display: 'flex', gap: 'var(--sp-3)', width: '100%', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedApp(null);
                }}
                disabled={actionLoading}
              >
                Close
              </button>
              {selectedApp.mentorApplicationStatus === 'pending' && (
                <>
                  <button
                    className="btn btn-outline"
                    onClick={() => openActionModal(selectedApp, 'info')}
                    disabled={actionLoading}
                  >
                    Request Info
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ color: 'var(--clr-danger)' }}
                    onClick={() => openActionModal(selectedApp, 'reject')}
                    disabled={actionLoading}
                  >
                    Reject
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--clr-success)' }}
                    onClick={() => openActionModal(selectedApp, 'approve')}
                    disabled={actionLoading}
                  >
                    Approve Applicant
                  </button>
                </>
              )}
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div
              className="card"
              style={{
                padding: 'var(--sp-4)',
                border: '1px solid var(--clr-border)',
                backgroundColor: 'var(--clr-bg-card)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid var(--clr-border)',
                  paddingBottom: 'var(--sp-3)',
                  marginBottom: 'var(--sp-3)',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--clr-text)' }}>
                    {selectedApp.mentorApplication?.fullName || 'Guide Applicant'}
                  </h3>
                  <span className="body-sm text-muted" style={{ fontSize: '0.85rem' }}>
                    {selectedApp.email}
                  </span>
                </div>
                {getStatusBadge(selectedApp.mentorApplicationStatus)}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 'var(--sp-3)',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 2 }}>
                    Phone Number
                  </p>
                  <span style={{ color: 'var(--clr-text)' }}>
                    {selectedApp.mentorApplication?.phone || 'N/A'}
                  </span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 2 }}>
                    Qualification / Education
                  </p>
                  <span style={{ color: 'var(--clr-text)' }}>
                    {selectedApp.mentorApplication?.qualification || 'N/A'}
                  </span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 2 }}>
                    Years of Experience
                  </p>
                  <span style={{ color: 'var(--clr-text)' }}>
                    {selectedApp.mentorApplication?.experience || '0'} years
                  </span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 2 }}>
                    Languages Spoken
                  </p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                    {selectedApp.mentorApplication?.languages?.map((lang) => (
                      <span key={lang} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {lang}
                      </span>
                    )) || <span style={{ color: 'var(--clr-text-subtle)' }}>N/A</span>}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'var(--sp-4)', borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-3)' }}>
                <p style={{ fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 4, fontSize: '0.85rem' }}>
                  Professional Summary / Bio
                </p>
                <p className="body-sm text-muted" style={{ lineHeight: 1.6, fontSize: '0.82rem' }}>
                  {selectedApp.mentorApplication?.bio || 'No bio submitted.'}
                </p>
              </div>

              <div style={{ marginTop: 'var(--sp-3)' }}>
                <p style={{ fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 4, fontSize: '0.85rem' }}>
                  Expertise Domains
                </p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {selectedApp.mentorApplication?.expertise?.map((exp) => (
                    <span key={exp} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                      {exp}
                    </span>
                  )) || <span style={{ color: 'var(--clr-text-subtle)' }}>N/A</span>}
                </div>
              </div>

              {selectedApp.mentorReviewNote && (
                <div
                  style={{
                    marginTop: 'var(--sp-4)',
                    padding: 'var(--sp-3)',
                    backgroundColor: 'var(--clr-bg-alt)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--clr-primary)',
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                    Administrative Review Note
                  </p>
                  <p
                    className="body-sm text-muted"
                    style={{ fontStyle: 'italic', marginTop: 2, fontSize: '0.8rem' }}
                  >
                    "{selectedApp.mentorReviewNote}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Action Prompt Modal (Approve / Reject / Request Info) ── */}
      {selectedApp && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => {
            if (!actionLoading) {
              setIsActionModalOpen(false);
            }
          }}
          title={
            actionType === 'approve'
              ? 'Approve Application'
              : actionType === 'reject'
              ? 'Reject Application'
              : 'Request Information'
          }
          footer={
            <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end', width: '100%' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setIsActionModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`btn ${
                  actionType === 'approve'
                    ? 'btn-primary'
                    : actionType === 'reject'
                    ? 'btn-danger'
                    : 'btn-primary'
                }`}
                style={actionType === 'approve' ? { backgroundColor: 'var(--clr-success)' } : {}}
                onClick={handlePerformAction}
                disabled={actionLoading || (actionType === 'info' && !actionNote.trim())}
              >
                {actionLoading ? (
                  'Processing...'
                ) : actionType === 'approve' ? (
                  'Approve'
                ) : actionType === 'reject' ? (
                  'Reject'
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <p className="body-sm text-muted">
              {actionType === 'approve' &&
                `Are you sure you want to approve ${selectedApp.mentorApplication?.fullName} as a verified mentor? They will gain access to the mentor portal and their public guide profile will be created.`}
              {actionType === 'reject' &&
                `Are you sure you want to reject the application submitted by ${selectedApp.mentorApplication?.fullName}? You can write an optional reason below for the rejection logs.`}
              {actionType === 'info' &&
                `Please specify what extra information or documentation you want ${selectedApp.mentorApplication?.fullName} to submit before we can complete their application review.`}
            </p>

            {(actionType === 'reject' || actionType === 'info') && (
              <div className="form-group">
                <label className="form-label" htmlFor="action-note-textarea">
                  {actionType === 'reject'
                    ? 'Rejection Reason (Optional)'
                    : 'Instructions to Applicant (Required)'}
                </label>
                <textarea
                  id="action-note-textarea"
                  rows={4}
                  className="form-input"
                  placeholder={
                    actionType === 'reject'
                      ? 'Write a reason...'
                      : 'Specify what is missing, e.g., missing qualifications, invalid link...'
                  }
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  disabled={actionLoading}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MentorApplications;
