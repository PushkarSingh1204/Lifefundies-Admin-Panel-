import React from 'react';
import { AlertOctagon } from 'lucide-react';

export const ErrorPage: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-12)',
      textAlign: 'center',
      minHeight: '60vh',
      backgroundColor: 'var(--clr-bg)'
    }}>
      <AlertOctagon size={64} style={{ color: 'var(--clr-danger)', marginBottom: 'var(--sp-4)' }} />
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--clr-text)' }}>Application Error</h2>
      <p className="text-muted" style={{ maxWidth: '400px', marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-6)', fontSize: '0.9rem' }}>
        The admin panel encountered an unexpected error. Try reloading the browser or checking console logs.
      </p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>
        Reload Application
      </button>
    </div>
  );
};
export default ErrorPage;
