# Quick Start Guide

## Authentication Setup

### Main Website (dangal2k26.online)
- **Login Method**: Google OAuth
- **Users**: Anyone with a Google account
- **Purpose**: User registration for events

### Admin Dashboard (admin.dangal2k26.online)
- **Login Method**: Username & Password
- **Default Credentials**:
  - Username: `admin@dangal`
  - Password: `felisleo`
- **Purpose**: Manage events, registrations, and live scores

## Local Development Setup

### 1. Install Dependencies

```bash
# Backend
cd server
npm install

# Client
cd ../client
npm install

# Admin
cd ../admin
npm install
```

### 2. Setup MongoDB

**Option A: MongoDB Atlas (Recommended)**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Add to `server/.env`

**Option B: Local MongoDB**
```bash
# Ubuntu/Debian
sudo apt install mongodb
sudo systemctl start mongodb
```

### 3. Setup Google OAuth

1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Secret to `server/.env`

### 4. Configure Environment Variables

**Backend (`server/.env`)**:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/dangal2k26
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
JWT_SECRET=your_random_secret_key
SESSION_SECRET=your_random_session_secret
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

**Client (`client/.env`)**:
```env
VITE_SHOW_LOADER=true
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Admin (`admin/.env`)**:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 5. Create Admin Account

```bash
cd server
npm run create-admin
```

Output:
```
Default admin created successfully!
Username: admin@dangal
Password: felisleo
Role: superadmin

⚠️  IMPORTANT: Change the password after first login!
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

**Terminal 3 - Admin:**
```bash
cd admin
npm run dev
```

### 7. Access Applications

- **Main Website**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5174
- **Backend API**: http://localhost:5000

## Testing Authentication

### Test User Login (Main Website)
1. Go to http://localhost:5173
2. Click "Register Now" or any login button
3. Login with Google account
4. You'll be redirected back to the website

### Test Admin Login (Admin Dashboard)
1. Go to http://localhost:5174
2. Enter credentials:
   - Username: `admin@dangal`
   - Password: `felisleo`
3. Click "Login"
4. You'll see the admin dashboard

### Change Admin Password
1. Login to admin dashboard
2. Click "Change Password" button in header
3. Enter current password: `felisleo`
4. Enter new password (min 6 characters)
5. Confirm new password
6. Click "Change Password"

## Common Issues

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running
```bash
sudo systemctl start mongodb
# or for MongoDB Atlas, check your connection string
```

### Google OAuth Error
```
Error: redirect_uri_mismatch
```
**Solution**: Add `http://localhost:5000/api/auth/google/callback` to authorized redirect URIs in Google Cloud Console

### CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution**: Make sure backend is running and CLIENT_URL/ADMIN_URL are correctly set in `server/.env`

### Admin Login Failed
```
Invalid credentials
```
**Solution**: 
1. Make sure you ran `npm run create-admin`
2. Check MongoDB connection
3. Verify credentials: `admin@dangal` / `felisleo`

## Next Steps

1. ✅ Setup complete
2. ✅ Test authentication
3. ✅ Change admin password
4. 🔜 Add registration schema
5. 🔜 Implement live scores
6. 🔜 Deploy to production

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions.

## Need Help?

- Check [server/README.md](./server/README.md) for backend details
- Check [admin/README.md](./admin/README.md) for admin dashboard details
- Check [client/INTEGRATION.md](./client/INTEGRATION.md) for client integration guide
