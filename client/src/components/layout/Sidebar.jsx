import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { navigationItems } from '../../data/navigationConfig.js';
import styles from './Sidebar.module.css';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.topSection}>
          <div className={styles.brand}>
            <Link to="/dashboard" className={styles.brandLink} onClick={onClose}>
              <div className={styles.logoIcon}>
                <Icons.ChefHat size={20} />
              </div>
              <div className={styles.brandText}>
                <span className={styles.brandName}>Smart Rasoi</span>
                <span className={styles.brandTagline}>Kitchen & Meals</span>
              </div>
            </Link>

            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close menu"
            >
              <Icons.X size={20} />
            </button>
          </div>

          <nav className={styles.nav} aria-label="Main Navigation">
            {navigationItems.map((item) => {
              const IconComponent = Icons[item.iconName] || Icons.CircleDot;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.activeItem : ''}`
                  }
                >
                  <IconComponent size={19} className={styles.icon} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
