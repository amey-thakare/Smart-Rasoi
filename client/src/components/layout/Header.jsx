import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck.js';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './Header.module.css';

export default function Header({ title = 'Dashboard', onToggleMobileMenu }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const { status: healthStatus } = useHealthCheck();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return 'SR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      <div className={styles.rightSection}>
        {/* Accessible Search Input */}
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search ingredients or recipes"
            placeholder="Search kitchen items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Real-time backend status indicator */}
        <div
          className={styles.apiStatusBadge}
          title={
            healthStatus === 'connected'
              ? 'Backend API is connected (GET /api/health)'
              : 'Backend is offline or connecting'
          }
        >
          <div
            className={`${styles.statusDot} ${
              healthStatus === 'connected'
                ? styles.dotConnected
                : healthStatus === 'disconnected'
                ? styles.dotDisconnected
                : styles.dotChecking
            }`}
          />
          <span>{healthStatus === 'connected' ? 'API Online' : 'API Standby'}</span>
        </div>

        {/* Demonstration Notification Control */}
        <div className={styles.notifWrapper} ref={notifRef}>
          <button
            type="button"
            className={styles.notifButton}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            <span className={styles.notifBadge} />
          </button>

          {showNotifications && (
            <div className={styles.notifDropdown} role="dialog" aria-label="Notifications preview">
              <div className={styles.notifHeader}>
                <span className={styles.notifHeading}>Notifications</span>
                <span className="badge badge-warning">2 Alerts</span>
              </div>

              <div className={styles.notifItem}>
                <span className={styles.notifItemTitle}>Tomatoes Expiring Tomorrow</span>
                <span className={styles.notifItemText}>
                  6 vine tomatoes are approaching their freshness window. Recommended recipe: Roasted Tomato Soup.
                </span>
                <span className={styles.notifItemTime}>2 hours ago</span>
              </div>

              <div className={styles.notifItem}>
                <span className={styles.notifItemTitle}>Meal Schedule Ready</span>
                <span className={styles.notifItemText}>
                  Your planned dinner tonight is Spiced Lentil Soup & Warm Roti.
                </span>
                <span className={styles.notifItemTime}>5 hours ago</span>
              </div>

              <div className={styles.notifFooterNotice}>
                Demonstration notification state (Phase 1 preview)
              </div>
            </div>
          )}
        </div>

        {/* User Profile Area & Working Logout */}
        <div className={styles.profileWrapper} ref={profileRef}>
          <button
            type="button"
            className={styles.userProfile}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="User profile options"
            aria-expanded={showProfileMenu}
          >
            <div className={styles.avatar}>{getInitials(user?.name)}</div>
            <span className={styles.userName}>{user?.name || 'Chef'}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {showProfileMenu && (
            <div className={styles.profileDropdown} role="menu" aria-label="Profile Menu">
              <div className={styles.profileInfoBlock}>
                <span className={styles.profileFullName}>{user?.name || 'Smart Rasoi Chef'}</span>
                <span className={styles.profileEmail}>{user?.email || ''}</span>
              </div>

              <Link
                to="/settings"
                className={styles.dropdownItem}
                onClick={() => setShowProfileMenu(false)}
                role="menuitem"
              >
                <Settings size={15} />
                <span>Account Settings</span>
              </Link>

              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={handleLogout}
                role="menuitem"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
