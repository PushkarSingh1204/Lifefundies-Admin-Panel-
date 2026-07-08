import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const accentColor = variant === 'danger' ? 'var(--clr-danger)' : 'var(--clr-warning)';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-dialog__header">
          <div className="confirm-dialog__icon" style={{ background: `${accentColor}15`, color: accentColor }}>
            <AlertTriangle size={22} />
          </div>
          <button className="btn-icon" onClick={onCancel} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__message">{message}</p>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className="btn"
            style={{
              background: accentColor,
              color: 'white',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: '1.5px' }} /> : null}
            <span>{loading ? 'Processing...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
