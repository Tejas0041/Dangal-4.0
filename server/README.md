# Dangal 2k26 Backend

Node.js backend with MongoDB, Socket.io, and Google OAuth authentication.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
   - Set MongoDB URI
   - Add Google OAuth credentials (get from Google Cloud Console) - for user authentication
   - Set JWT and session secrets
   - Configure URLs based on environment

4. Create default admin account:
```bash
npm run create-admin
```

This will create:
- Username: `admin@dangal`
- Password: `felisleo`
- Role: `superadmin`

**⚠️ IMPORTANT: Change the password after first login!**

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:5000/api/auth/google/callback`
   - Production: `https://backend.dangal2k26.online/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Endpoints

### User Authentication (Google OAuth)
- `GET /api/auth/google` - Initiate Google OAuth (for users)
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout user (requires auth)

### Admin Authentication (Username/Password)
- `POST /api/admin/login` - Admin login with username/password
- `GET /api/admin/me` - Get current admin (requires admin auth)
- `POST /api/admin/change-password` - Change admin password (requires admin auth)
- `POST /api/admin/logout` - Logout admin (requires admin auth)

### Health Check
- `GET /health` - Server health status

## Socket.io Events

### Client → Server
- `join-scores` - Join live scores room
- `leave-scores` - Leave live scores room

### Server → Client
- `score-update` - Live score updates (to be implemented)
- `match-start` - Match started notification (to be implemented)
- `match-end` - Match ended notification (to be implemented)

## Deployment

### Backend (backend.dangal2k26.online)
- Deploy on VPS/Cloud (DigitalOcean, AWS, etc.)
- Use PM2 for process management
- Configure Nginx as reverse proxy
- Enable SSL with Let's Encrypt

### Environment-specific URLs
- **Development:**
  - Client: http://localhost:5173
  - Admin: http://localhost:5174
  - Backend: http://localhost:5000

- **Production:**
  - Client: https://dangal2k26.online
  - Admin: https://admin.dangal2k26.online
  - Backend: https://backend.dangal2k26.online

## Database Schema

### User (for main website - Google OAuth)
- googleId (String, unique)
- email (String, unique)
- name (String)
- avatar (String)
- role (String: 'user')
- isActive (Boolean)
- timestamps

### Admin (for admin dashboard - Username/Password)
- username (String, unique)
- password (String, hashed with bcrypt)
- role (String: 'admin', 'superadmin')
- isActive (Boolean)
- lastLogin (Date)
- timestamps

## TODO
- [ ] Add registration schema and routes
- [ ] Add live score models and routes
- [ ] Add match management for admin
- [ ] Add real-time score updates via Socket.io
- [ ] Add admin dashboard API endpoints
