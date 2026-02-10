import { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    if (type === 'success') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      );
    } else if (type === 'error') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      );
    }
  };

  const getColors = () => {
    if (type === 'success') {
      return {
        bg: 'rgba(34, 197, 94, 0.15)',
        border: 'rgba(34, 197, 94, 0.4)',
        color: '#4ade80'
      };
    } else {
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        color: '#ff6b6b'
      };
    }
  };

  const colors = getColors();

  return (
    <div style={{
      position: 'fixed',
      top: '2rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10000,
      minWidth: '300px',
      maxWidth: '500px',
      padding: '1rem 1.5rem',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '0.75rem',
      color: colors.color,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      animation: 'slideDown 0.3s ease-out'
    }}>
      {getIcon()}
      <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: '500' }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: colors.color,
          cursor: 'pointer',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
