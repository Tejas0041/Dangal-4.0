# Authentication Implementation Summary

## Overview
Complete authentication system with Google OAuth for users and username/password for admin, including user management features.

## Features Implemented

### 1. Logout Button (Client)
- **Desktop View**: Shows user avatar, name, and logout button in navbar
- **Mobile View**: Shows user info card with avatar, name, email, and logout button in mobile menu
- **Location**: `client/src/components/Navbar.tsx`

### 2. User Management (Admin Dashboard)
- **New Page**: `/users` route in admin dashboard
- **Features**:
  - View all registered users in a table
  - Display user avatar, name, email, role, and join date
  - Delete user accounts with confirmation
  - Real-time user count
- **Files**:
  - `admin/src/pages/UserManagement.jsx` (new)
  - `admin/src/App.jsx` (updated with route)
  - `admin/src/components/AdminLayout.jsx` (added menu item)
  - `admin/src/pages/Dashboard.jsx` (shows live user count)

### 3. G Suite Email Validation
- **Backend Validation**: Only allows `@students.iiests.ac.in` emails
- **Implementation**:
  - Added `hd` parameter in passport strategy to restrict domain
  - Double validation in callback to ensure email domain
  - Error handling for non-G Suite accounts
- **Location**: `server/src/config/passport.js`

### 4. Google Account Selection
- **Force Account Picker**: Added `prompt: 'select_account'` parameter
- **Domain Restriction**: Added `hd: 'students.iiests.ac.in'` parameter
- **Result**: Only shows IIEST G Suite accounts in selection menu
- **Location**: `server/src/routes/auth.js`

## API Endpoints Added

### Admin Routes (`/api/admin`)
```javascript
GET    /api/admin/users          // Get all users (admin only)
DELETE /api/admin/users/:userId  // Delete a user (admin only)
```

## Technical Details

### G Suite Domain Restriction
The `hd` (hosted domain) parameter in Google OAuth:
- Restricts authentication to specific G Suite domain
- Shows only domain accounts in account picker
- Validates on Google's side before callback

### Security Features
- Double validation: Google OAuth + backend check
- Admin-only routes protected with `authenticateAdmin` middleware
- User deletion requires confirmation in UI
- JWT tokens with 7-day expiration

## Files Modified

### Client
- `client/src/App.tsx` - Wrapped with AuthProvider
- `client/src/components/Navbar.tsx` - Added logout button and user info
- `client/src/pages/Register.tsx` - Shows Google login for unauthenticated users

### Server
- `server/src/config/passport.js` - Added domain restriction and validation
- `server/src/routes/auth.js` - Added account selection prompt
- `server/src/routes/admin.js` - Added user management endpoints

### Admin
- `admin/src/App.jsx` - Added user management route
- `admin/src/components/AdminLayout.jsx` - Added menu item
- `admin/src/pages/Dashboard.jsx` - Shows live user count
- `admin/src/pages/UserManagement.jsx` - New user management page

## Testing

### Test G Suite Restriction
1. Try logging in with non-IIEST email - should fail
2. Try logging in with IIEST G Suite email - should succeed
3. Account picker should only show IIEST accounts

### Test User Management
1. Login to admin dashboard
2. Navigate to "User Management"
3. View all registered users
4. Delete a user (requires confirmation)
5. Check dashboard - user count should update

### Test Logout
1. Login as user on main website
2. Check navbar - should show user info and logout button
3. Click logout - should clear session and redirect
4. Try accessing protected routes - should redirect to login

## Environment Variables Required

### Server (.env)
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000
```

### Admin (.env)
```
VITE_API_URL=http://localhost:5000
```

## Notes

- The `hd` parameter only works with G Suite accounts, not regular Gmail
- Users must use their IIEST G Suite email (@students.iiests.ac.in)
- Admin can view and delete any user account
- Logout clears JWT token cookie
- User count updates in real-time on dashboard
