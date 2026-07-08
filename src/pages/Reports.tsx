import React from 'react';
import { PageHeader } from '../components/DataTable';
import { Zap, BookOpen } from 'lucide-react';

export const Reports: React.FC = () => {
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      {/* Page Header */}
      <PageHeader
        title="Reports & Moderation"
        subtitle="Comprehensive reporting and content moderation dashboard"
      />

      {/* Premium Placeholder Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--clr-primary-glow) 0%, var(--clr-accent-glow) 100%)',
          border: '1px solid var(--clr-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--sp-8)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--sp-4)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--clr-primary)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <BookOpen size={32} />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--clr-text)',
            fontFamily: 'var(--font-display)',
          }}
        >
          Reports Module Coming Soon
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--clr-text-muted)',
            lineHeight: '1.6',
            maxWidth: '500px',
          }}
        >
          The comprehensive Reports & Moderation module is currently under development. This module will provide:
        </p>

        {/* Features List */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--sp-4)',
            width: '100%',
            maxWidth: '600px',
            marginTop: 'var(--sp-2)',
          }}
        >
          {[
            { label: 'Content Flags', desc: 'User reports & moderation' },
            { label: 'Analytics', desc: 'Flag trends & patterns' },
            { label: 'Actions', desc: 'Resolve, dismiss, escalate' },
            { label: 'History', desc: 'Full audit trail' },
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                padding: 'var(--sp-4)',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 'var(--sp-2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ color: 'var(--clr-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                {feature.label}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-subtle)' }}>{feature.desc}</span>
            </div>
          ))}
        </div>

        {/* Status Badge */}
        <div style={{ marginTop: 'var(--sp-4)', paddingTop: 'var(--sp-4)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', width: '100%' }}>
          <div className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={12} />
            <span>In Development</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-subtle)', marginTop: 'var(--sp-2)' }}>
            Expected to be available in the next platform update
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div
        className="card"
        style={{
          background: 'rgba(37, 99, 235, 0.03)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--sp-4)',
        }}
      >
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--clr-text)', marginBottom: 'var(--sp-2)' }}>
          Firestore Security Rules
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', lineHeight: '1.6' }}>
          The <code style={{ background: 'var(--clr-bg-alt)', padding: '2px 6px', borderRadius: '3px' }}>reports</code> collection
          is already configured with admin-only read/write permissions in your Firestore Security Rules. Once this module is enabled,
          all data will be automatically protected and accessible only to administrators.
        </p>
      </div>
    </div>
  );
};

export default Reports;
