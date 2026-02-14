import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem'
      }}>
        {/* 404 Number */}
        <div style={{
          fontSize: 'clamp(4rem, 15vw, 10rem)',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          lineHeight: 1
        }}>
          404
        </div>

        {/* Icon */}
        <svg 
          width="120" 
          height="120" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#FFD700" 
          strokeWidth="1.5"
          style={{ marginBottom: '2rem', opacity: 0.6 }}
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>

        {/* Message */}
        <h1 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '1rem'
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#888',
          marginBottom: '3rem',
          maxWidth: '600px'
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '1rem 2rem',
              background: 'rgba(255, 215, 0, 0.2)',
              border: '1px solid rgba(255, 215, 0, 0.4)',
              borderRadius: '0.75rem',
              color: '#FFD700',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Go to Dashboard
          </button>

          
          {/* <button
            onClick={() => navigate(-1)}
            style={{
              padding: '1rem 2rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              color: '#aaa',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#aaa';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Go Back
          </button> */}
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotFound;
