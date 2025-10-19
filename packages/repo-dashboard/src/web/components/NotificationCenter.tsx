import React, { useState, useCallback } from 'react';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCenterProps {
  notifications?: Notification[];
  onNotificationRead?: (id: string) => void;
  onNotificationDismiss?: (id: string) => void;
  maxVisible?: number;
}

export default function NotificationCenter({
  notifications = [],
  onNotificationRead,
  onNotificationDismiss,
  maxVisible = 3,
}: NotificationCenterProps) {
  const [showCenter, setShowCenter] = useState(false);
  const [doNotDisturb, setDoNotDisturb] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const visibleNotifications = notifications.slice(0, maxVisible);

  const handleMarkAsRead = useCallback((id: string) => {
    onNotificationRead?.(id);
  }, [onNotificationRead]);

  const handleDismiss = useCallback((id: string) => {
    onNotificationDismiss?.(id);
  }, [onNotificationDismiss]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'error':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'success':
        return '#28a745';
      case 'info':
      default:
        return '#0366d6';
    }
  };

  return (
    <div className="notification-center-container">
      {/* Notification Bell */}
      <button
        className="notification-bell"
        onClick={() => setShowCenter(!showCenter)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={showCenter}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Notification Center Panel */}
      {showCenter && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button
              className="dnd-toggle"
              onClick={() => setDoNotDisturb(!doNotDisturb)}
              title={doNotDisturb ? 'Enable notifications' : 'Disable notifications'}
            >
              {doNotDisturb ? '🔕' : '🔔'}
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="notification-empty">
              <p>No notifications</p>
            </div>
          ) : (
            <div className="notification-list">
              {visibleNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.type} ${
                    notification.read ? 'read' : 'unread'
                  }`}
                  style={{
                    borderLeftColor: getNotificationColor(notification.type),
                  }}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {notification.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="notification-actions">
                    {!notification.read && (
                      <button
                        className="action-mark-read"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    {notification.action && (
                      <button
                        className="action-button"
                        onClick={notification.action.onClick}
                      >
                        {notification.action.label}
                      </button>
                    )}
                    <button
                      className="action-dismiss"
                      onClick={() => handleDismiss(notification.id)}
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > maxVisible && (
            <div className="notification-footer">
              <button className="view-all-link">
                View all {notifications.length} notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toast Notifications */}
      <div className="notification-toasts">
        {visibleNotifications
          .filter(n => !doNotDisturb)
          .map(notification => (
            <div
              key={`toast-${notification.id}`}
              className={`notification-toast ${notification.type}`}
              style={{
                borderLeftColor: getNotificationColor(notification.type),
              }}
            >
              <span className="toast-icon">
                {getNotificationIcon(notification.type)}
              </span>
              <div className="toast-content">
                <div className="toast-title">{notification.title}</div>
                <div className="toast-message">{notification.message}</div>
              </div>
              <button
                className="toast-close"
                onClick={() => handleDismiss(notification.id)}
              >
                ✕
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

