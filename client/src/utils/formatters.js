/**
 * Currency formatter (INR)
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date into standard display string (e.g. 15 Oct 2026)
 */
export const formatDateDisplay = (dateVal) => {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Calculate expiry status and display metadata for an item
 */
export const getItemExpiryStatus = (expiryDate) => {
  if (!expiryDate) {
    return {
      status: 'no-expiry',
      label: 'No Expiry Date',
      badgeClass: 'badge-neutral',
      color: '#7E8E85'
    };
  }

  const exp = new Date(expiryDate);
  if (isNaN(exp.getTime())) {
    return {
      status: 'no-expiry',
      label: 'Invalid Date',
      badgeClass: 'badge-neutral',
      color: '#7E8E85'
    };
  }

  const now = new Date();
  // Normalize both to midnight for day comparison
  const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((expDay - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      label: 'Expired',
      badgeClass: 'badge-danger',
      color: '#DC2626',
      urgent: true
    };
  }

  if (diffDays <= 7) {
    let label = `Expires in ${diffDays}d`;
    if (diffDays === 0) label = 'Expires Today';
    else if (diffDays === 1) label = 'Expires Tomorrow';

    return {
      status: 'expiring-soon',
      label,
      badgeClass: 'badge-warning',
      color: '#D97706',
      urgent: true
    };
  }

  return {
    status: 'fresh',
    label: `Fresh (${diffDays}d)`,
    badgeClass: 'badge-success',
    color: '#15803D',
    urgent: false
  };
};

/**
 * Calculate stock status (Low Stock vs In Stock)
 */
export const getItemStockStatus = (quantity, minimumQuantity = 1) => {
  const isLow = Number(quantity) <= Number(minimumQuantity);
  if (isLow) {
    return {
      status: 'low-stock',
      label: 'Low Stock',
      badgeClass: 'badge-danger',
      isLow: true
    };
  }

  return {
    status: 'in-stock',
    label: 'In Stock',
    badgeClass: 'badge-neutral',
    isLow: false
  };
};

/**
 * Legacy formatter for demonstration items with relative daysRemaining integer
 */
export const getExpiryStatusMeta = (daysRemaining) => {
  if (daysRemaining <= 1) {
    return {
      label: daysRemaining === 1 ? 'Expires in 1 day' : 'Expires today',
      badgeClass: 'badge-danger',
      indicatorColor: '#DC2626',
      urgent: true
    };
  }
  if (daysRemaining <= 3) {
    return {
      label: `Expires in ${daysRemaining} days`,
      badgeClass: 'badge-warning',
      indicatorColor: '#D97706',
      urgent: true
    };
  }
  if (daysRemaining <= 7) {
    return {
      label: `Expires in ${daysRemaining} days`,
      badgeClass: 'badge-neutral',
      indicatorColor: '#749184',
      urgent: false
    };
  }
  return {
    label: `Fresh (${daysRemaining}d+)`,
    badgeClass: 'badge-success',
    indicatorColor: '#15803D',
    urgent: false
  };
};
