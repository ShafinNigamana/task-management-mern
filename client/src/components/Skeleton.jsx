import React from 'react';

/**
 * Skeleton loader component.
 * Supports different variants and shapes.
 */
export function Skeleton({ variant = 'rect', width, height, className = '', style = {} }) {
  const customStyle = {
    width,
    height,
    ...style,
  };

  return (
    <div 
      className={`skeleton skeleton-${variant} ${className}`} 
      style={customStyle}
    />
  );
}

// Pre-defined skeletons for pages
export function DashboardSkeleton() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ marginBottom: 'var(--space-10)' }}>
        <Skeleton width="180px" height="32px" style={{ marginBottom: '8px' }} />
        <Skeleton width="280px" height="18px" />
      </div>
      
      <div className="summary-grid" style={{ marginBottom: 'var(--space-8)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="summary-card" style={{ padding: 'var(--space-5) var(--space-6)' }}>
            <div className="summary-content">
              <Skeleton width="80px" height="14px" style={{ marginBottom: '8px' }} />
              <Skeleton width="50px" height="32px" />
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-section" style={{ padding: 'var(--space-6)' }}>
        <Skeleton width="140px" height="22px" style={{ marginBottom: 'var(--space-5)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--color-surface)' }}>
              <div style={{ flex: 1 }}>
                <Skeleton width="200px" height="16px" style={{ marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Skeleton width="60px" height="12px" />
                  <Skeleton width="40px" height="12px" />
                </div>
              </div>
              <Skeleton width="85px" height="12px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TeamsSkeleton() {
  return (
    <div className="teams-container">
      <div className="teams-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-10)' }}>
        <div>
          <Skeleton width="120px" height="32px" style={{ marginBottom: '8px' }} />
          <Skeleton width="240px" height="18px" />
        </div>
      </div>
      <div className="teams-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="team-card" style={{ padding: 'var(--space-6)', minHeight: '180px' }}>
            <div className="team-card-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Skeleton width="150px" height="20px" style={{ marginBottom: '8px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton width="60px" height="14px" />
                  <Skeleton width="40px" height="14px" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton width="60px" height="14px" />
                  <Skeleton width="80px" height="14px" />
                </div>
              </div>
            </div>
            <Skeleton width="100px" height="32px" style={{ marginTop: '16px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="kanban-container">
      <div className="kanban-header" style={{ marginBottom: 'var(--space-8)' }}>
        <Skeleton width="240px" height="32px" style={{ marginBottom: '8px' }} />
        <Skeleton width="180px" height="18px" />
        <div className="kanban-filters" style={{ display: 'flex', gap: '6px', marginTop: 'var(--space-5)' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="80px" height="28px" style={{ borderRadius: '6px' }} />
          ))}
        </div>
      </div>
      
      <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)' }}>
        {[1, 2, 3].map((col) => (
          <div key={col} className="kanban-column" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <div className="kanban-column-header" style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="100px" height="16px" />
              <Skeleton width="24px" height="20px" style={{ borderRadius: '10px' }} />
            </div>
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2].map((card) => (
                <div key={card} className="kanban-card" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <Skeleton variant="circle" width="24px" height="24px" style={{ borderRadius: '50%' }} />
                    <Skeleton width="100px" height="16px" style={{ marginTop: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', paddingLeft: '36px' }}>
                    <Skeleton width="50px" height="16px" />
                    <Skeleton width="70px" height="16px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="reports-container">
      <div className="reports-header-wrapper" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="reports-header">
          <Skeleton width="140px" height="32px" style={{ marginBottom: '8px' }} />
          <Skeleton width="280px" height="18px" />
        </div>
        <Skeleton width="110px" height="32px" />
      </div>
      <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-8)' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="reports-section">
            <Skeleton width="180px" height="22px" style={{ marginBottom: 'var(--space-4)' }} />
            {i === 1 ? (
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <Skeleton width="100%" height="220px" />
              </div>
            ) : i === 2 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map((j) => (
                  <div key={j} className="reports-card" style={{ padding: 'var(--space-4)' }}>
                    <Skeleton width="40px" height="24px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="80px" height="12px" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="leaderboard-list">
                {[1, 2, 3].map((j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: j < 3 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Skeleton variant="circle" width="24px" height="24px" style={{ borderRadius: '50%', backgroundColor: 'var(--color-border)' }} />
                      <Skeleton width="120px" height="16px" />
                    </div>
                    <Skeleton width="40px" height="16px" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
