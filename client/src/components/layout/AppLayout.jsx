import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { navigationItems } from '../../data/navigationConfig.js';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Find matching nav title or fallback
  const currentNavItem = navigationItems.find((item) => item.path === location.pathname);
  const currentTitle = currentNavItem ? currentNavItem.label : 'Smart Rasoi';

  return (
    <div className={styles.layout}>
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className={styles.mainWrapper}>
        <Header
          title={currentTitle}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className={styles.contentContainer}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
