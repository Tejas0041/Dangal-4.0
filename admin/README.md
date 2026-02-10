# Dangal 2k26 Admin Dashboard

Admin dashboard for managing Dangal 2k26 events, registrations, and live scores.

## Setup

1. Install dependencies:
```bash
cd admin
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

## Development

```bash
npm run dev
```

Runs on http://localhost:5174

## Build

```bash
npm run build
```

## Features

- Google OAuth authentication
- Admin-only access
- Real-time score updates (Socket.io)
- User management
- Registration management
- Match scheduling
- Live score management

## Deployment

Deploy to **admin.dangal2k26.online**

### Build for production:
```bash
npm run build
```

The `dist` folder will contain the production build.

## Access Control

Only users with `admin` or `superadmin` role can access the dashboard.
Regular users will be redirected to the main website.
