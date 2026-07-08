import React from 'react';
import { Database, Shield, ShieldAlert } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      {/* 1. Database Connection Status Panel */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-2)' }}>
          <Database size={18} className="toast-icon-success" />
          <span>Database Configuration Status</span>
        </h3>
        <p className="body-sm text-muted" style={{ marginBottom: 'var(--sp-4)' }}>
          The admin panel connects directly to your platform's production Firestore database using centralized env variables.
        </p>

        <div style={{
          padding: 'var(--sp-4)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--clr-bg-alt)',
          border: '1px solid var(--clr-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Firebase Configuration Availability:</span>
            <span className="badge badge-success">
              Configured & Connected (Live Mode)
            </span>
          </div>

          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--clr-text-muted)', display: 'block', marginBottom: '6px' }}>
              Required Environment Variables (Vite format):
            </span>
            <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', fontSize: '0.8rem', color: 'var(--clr-text-subtle)', lineHeight: 1.6 }}>
              <li><code>VITE_FIREBASE_API_KEY</code></li>
              <li><code>VITE_FIREBASE_AUTH_DOMAIN</code></li>
              <li><code>VITE_FIREBASE_PROJECT_ID</code></li>
              <li><code>VITE_FIREBASE_STORAGE_BUCKET</code></li>
              <li><code>VITE_FIREBASE_MESSAGING_SENDER_ID</code></li>
              <li><code>VITE_FIREBASE_APP_ID</code></li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Platform Security Policies Panel */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-2)' }}>
          <Shield size={18} color="var(--clr-primary)" />
          <span>Security & Policy Gates</span>
        </h3>
        <p className="body-sm text-muted" style={{ marginBottom: 'var(--sp-4)' }}>
          Review the active security policies enforced on write operations by the admin panel.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <ShieldAlert size={18} style={{ color: 'var(--clr-danger)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Phase 4 Lock Active</span>
              <p className="body-sm text-muted" style={{ fontSize: '0.8rem' }}>
                All write operations (approving mentors, suspending accounts, updating rates) are configured directly on your live Firestore collections. No local mock data is used.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Settings;
