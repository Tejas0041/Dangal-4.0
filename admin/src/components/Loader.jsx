const Loader = ({ size = 'medium', fullScreen = false }) => {
  const sizes = {
    small: { spinner: '24px', border: '3px' },
    medium: { spinner: '40px', border: '4px' },
    large: { spinner: '60px', border: '5px' }
  };

  const { spinner, border } = sizes[size];

  const loaderStyle = {
    display: 'inline-block',
    width: spinner,
    height: spinner,
    border: `${border} solid rgba(255, 215, 0, 0.2)`,
    borderTop: `${border} solid #FFD700`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const containerStyle = fullScreen ? {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  };

  return (
    <div style={containerStyle}>
      <div style={loaderStyle} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
