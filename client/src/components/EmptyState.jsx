import React from 'react';

/**
 * Reusable empty state component with monochrome outline icon, title, description, and optional action button.
 */
export default function EmptyState({ 
  type = 'tasks', 
  title = 'No data available', 
  description = 'There is nothing to display here.', 
  actionLabel, 
  onAction 
}) {
  const renderIcon = () => {
    const iconProps = {
      width: "48",
      height: "48",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "empty-state-icon"
    };

    switch (type) {
      case 'teams':
        return (
          <svg {...iconProps}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'activity':
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'dashboard':
        return (
          <svg {...iconProps}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        );
      case 'tasks':
      default:
        return (
          <svg {...iconProps}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <polyline points="9 11 12 14 20 6" />
          </svg>
        );
    }
  };

  return (
    <div className="empty-state">
      <div className="empty-state-icon-wrapper">
        {renderIcon()}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <button 
          type="button" 
          className="btn btn-primary empty-state-btn" 
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
