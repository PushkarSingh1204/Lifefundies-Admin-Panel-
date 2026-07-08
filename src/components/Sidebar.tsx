import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  Video,
  MessageSquare,
  CreditCard,
  Flag,
  Settings,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/applications', label: 'Applications', icon: ClipboardList },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/mentors', label: 'Mentors', icon: GraduationCap },
    { path: '/bookings', label: 'Bookings', icon: CalendarDays },
    { path: '/sessions', label: 'Sessions', icon: Video },
    { path: '/community', label: 'Community', icon: MessageSquare },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/reports', label: 'Reports', icon: Flag },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Sidebar Header */}
      <div style={{
        height: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--sp-5)',
        borderBottom: '1px solid var(--clr-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            backgroundColor: 'var(--clr-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--clr-primary-foreground)',
            fontWeight: 800,
            fontSize: '0.8rem'
          }}>LF</div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: 'var(--clr-text)'
          }}>Admin Panel</span>
        </div>
        <button
          className="btn-icon"
          onClick={onClose}
          style={{ display: 'none', cursor: 'pointer' }}
          id="sidebar-close-btn"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation items */}
      <nav style={{
        flex: 1,
        padding: 'var(--sp-4) var(--sp-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-1)',
        overflowY: 'auto'
      }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-3)',
              padding: '0.625rem var(--sp-4)',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
              backgroundColor: isActive ? 'var(--clr-primary-glow)' : 'transparent',
              transition: 'var(--transition)'
            })}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div style={{
        padding: 'var(--sp-4)',
        borderTop: '1px solid var(--clr-border)'
      }}>
        <button
          className="btn btn-outline"
          onClick={handleLogout}
          style={{ width: '100%', gap: 'var(--sp-2)' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
