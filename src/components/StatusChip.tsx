import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle, Zap } from 'lucide-react';

interface StatusChipProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'md', showIcon = true }) => {
  const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    active: { label: 'Active', class: 'badge-success', icon: <Zap size={14} /> },
    completed: { label: 'Completed', class: 'badge-success', icon: <CheckCircle size={14} /> },
    approved: { label: 'Approved', class: 'badge-success', icon: <CheckCircle size={14} /> },
    pending: { label: 'Pending', class: 'badge-warning', icon: <Clock size={14} /> },
    scheduled: { label: 'Scheduled', class: 'badge-primary', icon: <Clock size={14} /> },
    processing: { label: 'Processing', class: 'badge-primary', icon: <Clock size={14} /> },
    cancelled: { label: 'Cancelled', class: 'badge-danger', icon: <XCircle size={14} /> },
    failed: { label: 'Failed', class: 'badge-danger', icon: <XCircle size={14} /> },
    rejected: { label: 'Rejected', class: 'badge-danger', icon: <XCircle size={14} /> },
    warning: { label: 'Warning', class: 'badge-warning', icon: <AlertCircle size={14} /> },
    info_requested: { label: 'Info Requested', class: 'badge-warning', icon: <AlertCircle size={14} /> },
    refunded: { label: 'Refunded', class: 'badge-neutral', icon: <CheckCircle size={14} /> },
    suspended: { label: 'Suspended', class: 'badge-danger', icon: <AlertCircle size={14} /> },
  };

  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    class: 'badge-neutral',
    icon: null,
  };

  const sizeClass = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }[size];

  return (
    <div
      className={`badge ${config.class} ${sizeClass}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showIcon ? '4px' : '0',
      }}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </div>
  );
};
