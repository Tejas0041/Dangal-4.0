const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Dialog */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
        width: '90%',
        maxWidth: '450px',
        background: 'rgba(26, 26, 26, 0.98)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        animation: 'scaleIn 0.2s ease-out'
      }}>
        {/* Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 1.5rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '2px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.5rem',
          color: '#fff',
          fontWeight: 'bold',
          marginBottom: '0.75rem',
          textAlign: 'center'
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          color: '#aaa',
          fontSize: '0.95rem',
          marginBottom: '2rem',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.75rem',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default ConfirmDialog;
