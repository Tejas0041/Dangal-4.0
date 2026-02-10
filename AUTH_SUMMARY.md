# Authentication System Summary

## Overview

The Dangal 2k26 platform uses **two separate authentication systems**:

### 1. Main Website (Client) - Google OAuth
- **URL**: dangal2k26.online
- **Login Method**: Google OAuth (Login with Google)
- **Users**: General public (students, participants)
- **Purpose**: Event registration and participation
- **Technology**: Passport.js + Google OAuth 2.0

### 2. Admin Dashboard - Username/Password
- **URL**: admin.dangal2k26.online
- **Login Method**: Username & Password
- **Default Credentials**:
  - Username: `admin@dangal`
  - Password: `felisleo` (⚠️ Change after first login!)
- **Users**: Admin staff only
- **Purpose**: Manage events, registrations, live scores
- **Technology**: bcrypt password hashing + JWT

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                        │
│                 backend.dangal2k26.online                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐     │
│  │   User Auth Routes   │    │  Admin Auth Routes   │     │
│  │  /api/auth/*         │    │  /api/admin/*        │     │
│  ├──────────────────────┤    ├──────────────────────┤     │
│  │ • Google OAuth       │    │ • Username/Password  │     │
│  │ • JWT Tokens         │    │ • bcrypt Hashing     │     │
│  │ • Cookie-based       │    │ • JWT Tokens         │     │
│  └──────────────────────┘    └──────────────────────┘     │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌──────────────────────┐    ┌──────────────────────┐     │
│  │   User Collection    │    │  Admin Collection    │     │
│  │   (MongoDB)          │    │  (MongoDB)           │     │
│  └──────────────────────┘    └──────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
           │                            │
           ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐
│   Main Website       │    │  Admin Dashboard     │
│ dangal2k26.online    │    │ admin.dangal2k26.    │
│                      │    │      online          │
├──────────────────────┤    ├──────────────────────┤
│ • Google Login Btn   │    │ • Username Field     │
│ • User Registration  │    │ • Password Field     │
│ • Event Viewing      │    │ • Change Password    │
│ • Live Scores        │    │ • Manage Everything  │
└──────────────────────┘    └──────────────────────┘
```

## Database Models

### User Model (for main website)
```javascript
{
  googleId: String (unique),
  email: String (unique),
  name: String,
  avatar: String,
  role: 'user',
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Admin Model (for admin dashboard)
```javascript
{
  username: String (unique),
  password: String (hashed),
  role: 'admin' | 'superadmin',
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### User Authentication (Main Website)
```
GET  /api/auth/google          - Initiate Google OAuth
GET  /api/auth/google/callback - OAuth callback
GET  /api/auth/me              - Get current user
POST /api/auth/logout          - Logout user
```

### Admin Authentication (Admin Dashboard)
```
POST /api/admin/login           - Login with username/password
GET  /api/admin/me              - Get current admin
POST /api/admin/change-password - Change password
POST /api/admin/logout          - Logout admin
```

## Security Features

### User Authentication
- ✅ Google OAuth 2.0 (secure, no password storage)
- ✅ JWT tokens (7-day expiry)
- ✅ HTTP-only cookies
- ✅ CORS protection
- ✅ Secure cookies in production

### Admin Authentication
- ✅ bcrypt password hashing (10 salt rounds)
- ✅ JWT tokens (7-day expiry)
- ✅ HTTP-only cookies
- ✅ Password strength validation (min 6 chars)
- ✅ Password change functionality
- ✅ Last login tracking
- ✅ Account activation/deactivation

## Setup Instructions

### 1. Create Admin Account
```bash
cd server
npm run create-admin
```

### 2. First Login
- Go to admin.dangal2k26.online
- Login with `admin@dangal` / `felisleo`
- **Immediately change password!**

### 3. Change Password
- Click "Change Password" in dashboard header
- Enter current password: `felisleo`
- Enter new secure password
- Confirm and save

## User Flow

### Main Website User Flow
```
1. User visits dangal2k26.online
2. Clicks "Register Now" or "Login"
3. Redirected to Google OAuth
4. Logs in with Google account
5. Redirected back to website
6. Can now register for events
```

### Admin Dashboard Flow
```
1. Admin visits admin.dangal2k26.online
2. Enters username: admin@dangal
3. Enters password: felisleo (or changed password)
4. Clicks "Login"
5. Access admin dashboard
6. Can manage events, scores, registrations
```

## Password Management

### Change Admin Password
1. Login to admin dashboard
2. Click "Change Password" button
3. Enter current password
4. Enter new password (min 6 characters)
5. Confirm new password
6. Submit

### Reset Admin Password (if forgotten)
```bash
# Connect to MongoDB
mongosh "<your-mongodb-uri>"

# Switch to database
use dangal2k26

# Update password (will be hashed on next login)
# You'll need to manually hash or use the create-admin script
```

## Production Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET and SESSION_SECRET
- [ ] Enable HTTPS (SSL certificates)
- [ ] Set secure cookie flags
- [ ] Configure CORS for production domains
- [ ] Set up MongoDB authentication
- [ ] Restrict MongoDB IP whitelist
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security audits

## Important Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Change default password immediately** after first deployment
3. **Use strong passwords** for admin accounts (min 12 chars recommended)
4. **Enable 2FA** for Google accounts used for OAuth
5. **Regular backups** of MongoDB database
6. **Monitor login attempts** for suspicious activity
7. **Keep dependencies updated** for security patches

## Support

For issues or questions:
- Check [QUICK_START.md](./QUICK_START.md) for setup help
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Check individual README files in each folder
