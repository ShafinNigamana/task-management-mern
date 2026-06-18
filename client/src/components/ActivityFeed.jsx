import { useEffect, useState, useCallback } from 'react';
import { getAuditLogs } from '../services/auditService';
import { Skeleton } from './Skeleton';
import EmptyState from './EmptyState';

function formatActionText(log) {
  const payload = typeof log.payload_json === 'string'
    ? JSON.parse(log.payload_json)
    : log.payload_json;

  const title = payload?.title ? `"${payload.title}"` : '';

  switch (log.action) {
    case 'CREATE_TASK':
      return `Created task ${title}`.trim();
    case 'UPDATE_TASK':
      if (payload?.updatedFields?.status) {
        const statusMap = {
          'todo': 'To Do',
          'in-progress': 'In Progress',
          'done': 'Done'
        };
        const status = statusMap[payload.updatedFields.status] || payload.updatedFields.status;
        return `Moved task ${title} to ${status}`.trim();
      }
      return `Updated task ${title}`.trim();
    case 'DELETE_TASK':
      return `Deleted task ${title}`.trim();
    default:
      return `${log.action} action performed`;
  }
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;

  if (isNaN(diffMs) || diffMs < 0) return 'Just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  } else if (diffHrs < 24) {
    return `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export default function ActivityFeed({ teamId }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const limit = 20;

  const fetchFeed = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getAuditLogs(teamId, page, limit);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setError(null);
    } catch {
      setError('Failed to load activity feed.');
    } finally {
      setLoading(false);
    }
  }, [teamId, page]);

  // Initial fetch and fetch on page change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFeed(false);
  }, [fetchFeed]);

  // Poll every 5 seconds (runs silently in the background)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFeed(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  if (loading) {
    return (
      <div className="activity-feed-section">
        <h2 className="activity-feed-title">Recent Activity</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ padding: '12px 16px', background: 'var(--color-surface)' }}>
              <Skeleton width="180px" height="14px" style={{ marginBottom: '8px' }} />
              <Skeleton width="100px" height="10px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-feed-section">
        <h2 className="activity-feed-title">Recent Activity</h2>
        <div className="activity-error">
          <div className="error-card">{error}</div>
        </div>
      </div>
    );
  }

  const getActionInfo = (action) => {
    switch (action) {
      case 'CREATE_TASK':
        return { className: 'activity-feed-item--create', icon: '+' };
      case 'UPDATE_TASK':
        return { className: 'activity-feed-item--update', icon: '↻' };
      case 'DELETE_TASK':
        return { className: 'activity-feed-item--delete', icon: '×' };
      default:
        return { className: '', icon: '•' };
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="activity-feed-section">
      <h2 className="activity-feed-title">Recent Activity</h2>

      {logs.length === 0 ? (
        <EmptyState 
          type="activity" 
          title="No activity yet" 
          description="Actions on this team will appear here." 
        />
      ) : (
        <>
          <div className="activity-feed-list">
            {logs.map((log) => {
              const info = getActionInfo(log.action);
              return (
                <div key={log.id} className={`activity-feed-item ${info.className}`}>
                  <span className="activity-item-content">
                    <span className="activity-item-icon">{info.icon}</span>
                    {formatActionText(log)}
                  </span>
                  <span className="activity-item-time">{formatRelativeTime(log.created_at)}</span>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="activity-pagination">
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn btn-ghost pagination-btn"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-ghost pagination-btn"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
