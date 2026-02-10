# Client Backend Integration Guide

## Environment Variables

The client uses these environment variables (configured in `.env`):

- `VITE_SHOW_LOADER` - Show/hide the loader animation
- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.io server URL

## Available Utilities

### 1. API Client (`src/lib/api.ts`)

Pre-configured axios instance for making API calls:

```typescript
import api from '@/lib/api';

// Example: Fetch data
const response = await api.get('/api/some-endpoint');

// Example: Post data
const response = await api.post('/api/register', { data });
```

Features:
- Automatic cookie handling (for authentication)
- Base URL from environment variables
- Error interceptors
- Request/response interceptors

### 2. Socket.io Client (`src/lib/socket.ts`)

For real-time updates:

```typescript
import { getSocket } from '@/lib/socket';

const socket = getSocket();

// Listen for events
socket.on('score-update', (data) => {
  console.log('Score updated:', data);
});

// Emit events
socket.emit('join-scores');
```

### 3. Auth Context (`src/context/AuthContext.tsx`)

For user authentication:

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.name}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={login}>Login with Google</button>
      )}
    </div>
  );
}
```

### 4. Live Scores Hook (`src/hooks/useLiveScores.ts`)

For real-time score updates:

```typescript
import { useLiveScores } from '@/hooks/useLiveScores';

function ScoreBoard() {
  const { scores, connected } = useLiveScores();

  return (
    <div>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      {scores.map((score) => (
        <div key={score.matchId}>
          {score.team1} vs {score.team2}: {score.score1} - {score.score2}
        </div>
      ))}
    </div>
  );
}
```

## Usage Examples

### Adding Authentication to App

Wrap your app with AuthProvider in `App.tsx`:

```typescript
import { AuthProvider } from '@/context/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### Protected Routes

Create a protected route component:

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;

  return children;
}
```

### Making API Calls in Register Page

```typescript
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function Register() {
  const { user } = useAuth();

  const handleSubmit = async (formData) => {
    try {
      const response = await api.post('/api/register', formData);
      console.log('Registration successful:', response.data);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  if (!user) {
    return <div>Please login first</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Displaying Live Scores

```typescript
import { useLiveScores } from '@/hooks/useLiveScores';

function LiveScoresSection() {
  const { scores, connected } = useLiveScores();

  return (
    <section>
      <h2>Live Scores</h2>
      {!connected && <p>Connecting to live updates...</p>}
      
      <div className="scores-grid">
        {scores
          .filter(score => score.status === 'live')
          .map((score) => (
            <div key={score.matchId} className="score-card">
              <h3>{score.event}</h3>
              <div className="teams">
                <span>{score.team1}</span>
                <span className="score">{score.score1} - {score.score2}</span>
                <span>{score.team2}</span>
              </div>
              <span className="live-badge">LIVE</span>
            </div>
          ))}
      </div>
    </section>
  );
}
```

## Configuration Checklist

- [x] Environment variables configured in `.env`
- [x] API client created (`src/lib/api.ts`)
- [x] Socket.io client created (`src/lib/socket.ts`)
- [x] Auth context created (`src/context/AuthContext.tsx`)
- [x] Live scores hook created (`src/hooks/useLiveScores.ts`)
- [ ] Wrap App with AuthProvider (when needed)
- [ ] Implement registration form with API calls (when ready)
- [ ] Add live scores display (when ready)
- [ ] Add protected routes (when needed)

## Next Steps

1. **For Registration:**
   - Wrap App with `<AuthProvider>`
   - Add login button that calls `login()` from `useAuth()`
   - Update Register page to use `api.post('/api/register', data)`
   - Check if user is logged in before showing registration form

2. **For Live Scores:**
   - Use `useLiveScores()` hook in your component
   - Display scores in real-time
   - Show connection status

3. **Testing:**
   - Start backend: `cd server && npm run dev`
   - Start client: `cd client && npm run dev`
   - Test Google login flow
   - Test API calls
   - Test Socket.io connection

## Important Notes

- All API calls automatically include credentials (cookies)
- Socket.io automatically reconnects on disconnect
- Auth state is managed globally via Context
- Environment variables must start with `VITE_` to be accessible in client
