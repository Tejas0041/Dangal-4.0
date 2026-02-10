# Dangal 2k26 Deployment Guide

## Architecture

- **Main Website**: dangal2k26.online (React client)
- **Admin Dashboard**: admin.dangal2k26.online (React admin)
- **Backend API**: backend.dangal2k26.online (Node.js + MongoDB + Socket.io)

## Prerequisites

1. Domain: dangal2k26.online
2. VPS/Cloud Server (DigitalOcean, AWS, etc.)
3. MongoDB Atlas account (or self-hosted MongoDB)
4. Google Cloud Console project for OAuth

## Step 1: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Dangal 2k26"
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://backend.dangal2k26.online/api/auth/google/callback`
     - `http://localhost:5000/api/auth/google/callback` (for development)
5. Copy Client ID and Client Secret

## Step 2: MongoDB Setup

### Option A: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create database user
4. Whitelist IP addresses (or allow from anywhere: 0.0.0.0/0)
5. Get connection string

### Option B: Self-hosted MongoDB
```bash
# Install MongoDB on Ubuntu
sudo apt update
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Step 3: Server Setup

### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install PM2
```bash
sudo npm install -g pm2
```

### Clone Repository
```bash
git clone <your-repo-url>
cd dangal2k26
```

## Step 4: Backend Deployment

```bash
cd server
npm install

# Create .env file
cp .env.example .env
nano .env
```

Configure `.env`:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=<your-mongodb-uri>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://backend.dangal2k26.online/api/auth/google/callback
JWT_SECRET=<generate-random-string>
SESSION_SECRET=<generate-random-string>
CLIENT_URL=https://dangal2k26.online
ADMIN_URL=https://admin.dangal2k26.online
```

Start with PM2:
```bash
pm2 start src/index.js --name dangal-backend
pm2 save
pm2 startup
```

## Step 5: Client Build

```bash
cd ../client
npm install

# Create .env
cp .env.example .env
nano .env
```

Configure `.env`:
```env
VITE_API_URL=https://backend.dangal2k26.online
VITE_SOCKET_URL=https://backend.dangal2k26.online
VITE_SHOW_LOADER=true
```

Build:
```bash
npm run build
```

## Step 6: Admin Build

```bash
cd ../admin
npm install

# Create .env
cp .env.example .env
nano .env
```

Configure `.env`:
```env
VITE_API_URL=https://backend.dangal2k26.online
VITE_SOCKET_URL=https://backend.dangal2k26.online
```

Build:
```bash
npm run build
```

## Step 7: Nginx Configuration

Install Nginx:
```bash
sudo apt install -y nginx
```

### Main Website (dangal2k26.online)
```bash
sudo nano /etc/nginx/sites-available/dangal2k26.online
```

```nginx
server {
    listen 80;
    server_name dangal2k26.online www.dangal2k26.online;
    
    root /var/www/dangal2k26.online;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Admin Dashboard (admin.dangal2k26.online)
```bash
sudo nano /etc/nginx/sites-available/admin.dangal2k26.online
```

```nginx
server {
    listen 80;
    server_name admin.dangal2k26.online;
    
    root /var/www/admin.dangal2k26.online;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Backend API (backend.dangal2k26.online)
```bash
sudo nano /etc/nginx/sites-available/backend.dangal2k26.online
```

```nginx
server {
    listen 80;
    server_name backend.dangal2k26.online;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Socket.io support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable sites:
```bash
sudo ln -s /etc/nginx/sites-available/dangal2k26.online /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.dangal2k26.online /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/backend.dangal2k26.online /etc/nginx/sites-enabled/
```

Copy build files:
```bash
sudo mkdir -p /var/www/dangal2k26.online
sudo mkdir -p /var/www/admin.dangal2k26.online
sudo cp -r client/dist/* /var/www/dangal2k26.online/
sudo cp -r admin/dist/* /var/www/admin.dangal2k26.online/
```

Test and restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: SSL Certificates (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d dangal2k26.online -d www.dangal2k26.online
sudo certbot --nginx -d admin.dangal2k26.online
sudo certbot --nginx -d backend.dangal2k26.online
```

Certbot will automatically configure SSL and set up auto-renewal.

## Step 9: DNS Configuration

Add these DNS records to your domain:

| Type | Name | Value |
|------|------|-------|
| A | @ | Your-Server-IP |
| A | www | Your-Server-IP |
| A | admin | Your-Server-IP |
| A | backend | Your-Server-IP |

## Step 10: Firewall Setup

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Step 11: Make First User Admin

After first login, manually update user role in MongoDB:

```bash
# Connect to MongoDB
mongosh "<your-mongodb-uri>"

# Switch to database
use dangal2k26

# Find your user
db.users.find({ email: "your-email@gmail.com" })

# Update role to superadmin
db.users.updateOne(
  { email: "your-email@gmail.com" },
  { $set: { role: "superadmin" } }
)
```

## Monitoring

```bash
# View backend logs
pm2 logs dangal-backend

# Monitor processes
pm2 monit

# Restart backend
pm2 restart dangal-backend
```

## Updates

To deploy updates:

```bash
# Pull latest code
git pull

# Backend
cd server
npm install
pm2 restart dangal-backend

# Client
cd ../client
npm install
npm run build
sudo cp -r dist/* /var/www/dangal2k26.online/

# Admin
cd ../admin
npm install
npm run build
sudo cp -r dist/* /var/www/admin.dangal2k26.online/
```

## Troubleshooting

### Backend not starting
```bash
pm2 logs dangal-backend
```

### Check MongoDB connection
```bash
mongosh "<your-mongodb-uri>"
```

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### SSL issues
```bash
sudo certbot renew --dry-run
```

## Security Checklist

- [ ] Change all default secrets in .env
- [ ] Enable firewall (ufw)
- [ ] Set up MongoDB authentication
- [ ] Restrict MongoDB IP whitelist
- [ ] Enable HTTPS only
- [ ] Set secure cookie flags in production
- [ ] Regular backups of MongoDB
- [ ] Keep Node.js and dependencies updated
- [ ] Monitor PM2 logs regularly
