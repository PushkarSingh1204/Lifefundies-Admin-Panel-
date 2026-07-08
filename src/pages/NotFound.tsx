import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-12)',
      textAlign: 'center',
      minHeight: '60vh'
    }} className="animate-fadeIn">
      <FileQuestion size={64} style={{ color: 'var(--clr-text-subtle)', marginBottom: 'var(--sp-4)' }} />
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--clr-text)' }}>Page Not Found</h2>
      <p className="text-muted" style={{ maxWidth: '400px', marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-6)', fontSize: '0.9rem' }}>
        The administrative panel route you are trying to access does not exist or has been relocated.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        Return to Dashboard
      </Link>
    </div>
  );
};
export default NotFound;
