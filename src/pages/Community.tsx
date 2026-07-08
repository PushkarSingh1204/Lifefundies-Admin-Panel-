import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
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
import { MessageSquare, Heart, MessageCircle, Trash2, Eye } from 'lucide-react';

const PAGE_SIZE = 15;

const formatDate = (ts: any) => {
  if (!ts) return 'N/A';
  const d = ts?.toDate?.() ?? new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const DOMAIN_COLORS: Record<string, string> = {
  career: 'badge-primary',
  academic: 'badge-success',
  emotional: 'badge-warning',
  financial: 'badge-danger',
  relationships: 'badge-neutral',
};

export const Community: React.FC = () => {
  const { showToast } = useToast();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Real-time listener ──────────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'community_posts'),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return { id: docSnap.id, ...data };
        });
        setPosts(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore community fetch failed:', err);
        showToast('Failed to fetch community posts.', 'error');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── Filter ──────────────────────────────────────────────────────────────
  const filtered = posts.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (p.title || '').toLowerCase().includes(q) ||
      (p.content || '').toLowerCase().includes(q) ||
      (p.authorName || '').toLowerCase().includes(q);
    const matchesDomain = domainFilter === 'all' || p.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  // ── Sort ────────────────────────────────────────────────────────────────
  const { sorted, sortKey, sortDir, requestSort } = useSortableData<any>(filtered);

  // ── Reset page when filters change ─────────────────────────────────────
  useEffect(() => { setPage(1); }, [searchQuery, domainFilter]);

  // ── Paginate ────────────────────────────────────────────────────────────
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Delete handler ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget || !db) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'community_posts', deleteTarget.id));
      showToast('Post deleted successfully.', 'success');
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Delete post error:', err);
      showToast(err.message || 'Failed to delete post.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── CSV export ──────────────────────────────────────────────────────────
  const handleExport = () => {
    exportToCSV(
      'community_posts.csv',
      sorted.map((p) => ({
        id: p.id,
        title: p.title || '',
        author: p.authorName || '',
        domain: p.domain || '',
        upvotes: p.upvotes ?? 0,
        commentCount: p.commentCount ?? 0,
        createdAt: formatDate(p.createdAt),
      }))
    );
  };

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <PageHeader
        title="Community Management"
        subtitle="Moderate posts and maintain community health"
        actions={
          <button className="btn btn-outline" onClick={handleExport} style={{ fontSize: '0.85rem' }}>
            Export CSV
          </button>
        }
      />

      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={(v) => setSearchQuery(v)}
        placeholder="Search by title, content, or author name…"
        filters={
          <select
            className="filter-select"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            <option value="all">All Domains</option>
            <option value="career">Career</option>
            <option value="academic">Academic</option>
            <option value="emotional">Emotional</option>
            <option value="financial">Financial</option>
            <option value="relationships">Relationships</option>
          </select>
        }
      />

      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={40} className="empty-icon" />
          <h3>No posts found</h3>
          <p>No community posts match your current search and filter criteria.</p>
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
                  label="Title / Author"
                  sortKey="title"
                  currentSortKey={sortKey as string}
                  sortDir={sortDir}
                  onSort={() => requestSort('title')}
                />
                <th>Domain</th>
                <th>Content</th>
                <SortableTh
                  label="Upvotes"
                  sortKey="upvotes"
                  currentSortKey={sortKey as string}
                  sortDir={sortDir}
                  onSort={() => requestSort('upvotes')}
                />
                <SortableTh
                  label="Comments"
                  sortKey="commentCount"
                  currentSortKey={sortKey as string}
                  sortDir={sortDir}
                  onSort={() => requestSort('commentCount')}
                />
                <SortableTh
                  label="Posted"
                  sortKey="createdAt"
                  currentSortKey={sortKey as string}
                  sortDir={sortDir}
                  onSort={() => requestSort('createdAt')}
                />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((post) => {
                const isExpanded = expandedId === post.id;
                const domainBadgeClass = DOMAIN_COLORS[post.domain] || 'badge-neutral';
                return (
                  <React.Fragment key={post.id}>
                    <tr>
                      {/* Title + Author */}
                      <td style={{ minWidth: 200, maxWidth: 280 }}>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : post.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--clr-primary)',
                              fontSize: '0.88rem',
                              lineHeight: 1.3,
                            }}
                          >
                            {post.title || '—'}
                          </div>
                        </button>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--clr-text-muted)',
                            marginTop: 2,
                          }}
                        >
                          {post.authorName || 'Unknown'}
                        </div>
                      </td>

                      {/* Domain badge */}
                      <td>
                        {post.domain ? (
                          <span className={`badge ${domainBadgeClass}`} style={{ textTransform: 'capitalize' }}>
                            {post.domain}
                          </span>
                        ) : (
                          <span className="badge badge-neutral">—</span>
                        )}
                      </td>

                      {/* Content snippet */}
                      <td style={{ maxWidth: 280 }}>
                        <div
                          className="truncate-2"
                          style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', lineHeight: 1.4 }}
                        >
                          {post.content || '—'}
                        </div>
                      </td>

                      {/* Upvotes */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <Heart size={13} style={{ color: 'var(--clr-danger)' }} />
                          <span style={{ fontWeight: 600 }}>{post.upvotes ?? 0}</span>
                        </div>
                      </td>

                      {/* Comments */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <MessageCircle size={13} style={{ color: 'var(--clr-primary)' }} />
                          <span style={{ fontWeight: 600 }}>{post.commentCount ?? 0}</span>
                        </div>
                      </td>

                      {/* Created at */}
                      <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {formatDate(post.createdAt)}
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => setExpandedId(isExpanded ? null : post.id)}
                            title={isExpanded ? 'Collapse' : 'Expand post'}
                          >
                            <Eye size={12} />
                            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              color: 'var(--clr-danger)',
                              borderColor: 'rgba(239, 68, 68, 0.25)',
                            }}
                            onClick={() => setDeleteTarget(post)}
                            title="Delete post"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            padding: 'var(--sp-4) var(--sp-6)',
                            background: 'var(--clr-bg-alt)',
                            borderTop: '1px solid var(--clr-border)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.875rem',
                              color: 'var(--clr-text)',
                              lineHeight: 1.7,
                              whiteSpace: 'pre-wrap',
                              maxWidth: 820,
                            }}
                          >
                            <span
                              style={{
                                display: 'block',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                color: 'var(--clr-text-subtle)',
                                marginBottom: 'var(--sp-2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              Full Content
                            </span>
                            {post.content || 'No content available.'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </TableWrapper>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        variant="danger"
        title="Delete Post"
        message={`Are you sure you want to permanently delete the post "${deleteTarget?.title || 'this post'}"? This action cannot be undone.`}
        confirmLabel="Delete Post"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Community;
