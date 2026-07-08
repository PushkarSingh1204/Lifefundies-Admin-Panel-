import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Menu, Sun, Moon, Database } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  // Simple title mapper based on current pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/applications')) return 'Mentor Applications';
    if (path.startsWith('/users')) return 'Users & Accounts';
    if (path.startsWith('/mentors')) return 'Verified Mentors';
    if (path.startsWith('/bookings')) return 'Session Bookings';
    if (path.startsWith('/sessions')) return 'Active Sessions';
    if (path.startsWith('/community')) return 'Community Management';
    if (path.startsWith('/payments')) return 'Payments & Revenue';
    if (path.startsWith('/reports')) return 'System Reports';
    if (path.startsWith('/settings')) return 'Admin Settings';
    return 'Admin Panel';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="admin-header">
      {/* Left side: Hamburger (mobile) and page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
        <button
          className="btn-icon"
          onClick={onToggleSidebar}
          style={{ display: 'block', cursor: 'pointer' }}
          id="sidebar-toggle-btn"
        >
          <Menu size={20} />
        </button>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '1.25rem',
          color: 'var(--clr-text)'
        }}>{getPageTitle()}</h2>
      </div>

      {/* Right side: Database mode toggle, theme toggle, profile avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <span className="badge badge-success" style={{ gap: '4px' }}>
            <Database size={12} />
            <span>Live Database</span>
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          className="btn-icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{ cursor: 'pointer' }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Profile Avatar */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--clr-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--clr-accent-hover)',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              {getInitials(user.displayName)}
            </div>
            <span className="body-sm" style={{ fontWeight: 500, display: 'none' }}>
              {user.displayName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
