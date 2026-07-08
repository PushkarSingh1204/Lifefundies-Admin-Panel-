import React from 'react';
import { Mail, Phone, Badge, Star } from 'lucide-react';

interface ProfileCardProps {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  stats?: Array<{ label: string; value: string | number }>;
  badges?: string[];
  actions?: React.ReactNode;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  email,
  phone,
  role,
  avatar,
  bio,
  rating,
  stats,
  badges,
  actions,
}) => {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-4)',
      }}
    >
      {/* Header with avatar and name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-4)' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--clr-primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--clr-primary)',
            flexShrink: 0,
            backgroundImage: avatar ? `url(${avatar})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!avatar && name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--clr-text)',
              marginBottom: 'var(--sp-1)',
            }}
          >
            {name}
          </h3>
          {role && (
            <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
              {role}
            </div>
          )}
          {rating && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: 'var(--sp-1)',
              }}
            >
              <Star size={14} style={{ color: 'var(--clr-warning)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                {rating.toFixed(1)} rating
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      {(email || phone) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {email && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                fontSize: '0.875rem',
              }}
            >
              <Mail size={16} style={{ color: 'var(--clr-text-muted)' }} />
              <span style={{ color: 'var(--clr-text)' }}>{email}</span>
            </div>
          )}
          {phone && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                fontSize: '0.875rem',
              }}
            >
              <Phone size={16} style={{ color: 'var(--clr-text-muted)' }} />
              <span style={{ color: 'var(--clr-text)' }}>{phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Bio */}
      {bio && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--clr-text-muted)',
            lineHeight: '1.5',
          }}
        >
          {bio}
        </p>
      )}

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          {badges.map((badge) => (
            <div
              key={badge}
              className="badge badge-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
              }}
            >
              <Badge size={12} />
              {badge}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(80px, 1fr))`,
            gap: 'var(--sp-3)',
            paddingTop: 'var(--sp-3)',
            borderTop: '1px solid var(--clr-border)',
          }}
        >
          {stats.map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--clr-text)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-2)',
            paddingTop: 'var(--sp-3)',
            borderTop: '1px solid var(--clr-border)',
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
};
