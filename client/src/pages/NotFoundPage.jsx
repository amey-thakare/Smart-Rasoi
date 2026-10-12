import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.errorCode}>404</div>
      <h1 className={styles.title}>Page Not Found</h1>
      <p className={styles.description}>
        The kitchen section or page you are looking for does not exist or may have been moved.
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>
        <Link to="/dashboard" className="btn btn-primary">
          <LayoutDashboard size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
