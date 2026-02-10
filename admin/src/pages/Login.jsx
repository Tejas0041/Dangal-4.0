import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      navigate('/dashboard', { replace: true });
    }
  }, [admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '3rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '1rem',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          textAlign: 'center',
          background: 'linear-gradient(to right, #FFD700, #FFA500)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          DANGAL 4.0
        </h1>
        <h2 style={{
          fontSize: '1.2rem',
          marginBottom: '2rem',
          textAlign: 'center',
          color: '#ffffff',
        }}>
          Admin Dashboard
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#FFD700',
              fontSize: '0.9rem',
              fontWeight: 'bold',
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '1rem',
              }}
              placeholder="admin@dangal"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#FFD700',
              fontSize: '0.9rem',
              fontWeight: 'bold',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '1rem',
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '0.5rem',
              color: '#ff6b6b',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#000',
              background: loading ? '#999' : '#FFD700',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
