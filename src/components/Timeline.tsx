import React from 'react';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  variant?: 'vertical' | 'horizontal';
}

export const Timeline: React.FC<TimelineProps> = ({ events, variant = 'vertical' }) => {
  if (events.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--sp-6)',
          textAlign: 'center',
          color: 'var(--clr-text-muted)',
        }}
      >
        No events to display
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: variant === 'vertical' ? 'column' : 'row',
        gap: 'var(--sp-4)',
      }}
    >
      {events.map((event) => (
        <div
          key={event.id}
          className="activity-item"
          style={{
            display: 'flex',
            gap: 'var(--sp-3)',
            flexDirection: variant === 'vertical' ? 'row' : 'column',
            flex: variant === 'horizontal' ? 1 : 'auto',
          }}
        >
          <div
            className="activity-dot"
            style={{
              background: event.iconBg || 'var(--clr-primary-glow)',
              color: event.iconColor || 'var(--clr-primary)',
              minWidth: '34px',
              minHeight: '34px',
            }}
          >
            {event.icon}
          </div>
          <div className="activity-content">
            <div className="activity-text" style={{ fontWeight: 500 }}>
              {event.title}
            </div>
            {event.description && (
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                {event.description}
              </div>
            )}
            <div className="activity-time">{event.timestamp}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
