# Event Settings - Countdown Timer Management

## Overview

The countdown timer on the main website now fetches the event date/time from the backend, which can be managed through the admin dashboard.

## Features

### Backend API
- **Model**: `EventSettings` - Stores event date, name, and status
- **Routes**:
  - `GET /api/event/settings` - Public endpoint to get event date
  - `PUT /api/event/settings` - Admin-only endpoint to update event date

### Admin Dashboard
- **Event Settings Page**: `/event-settings`
- Update event name and date/time
- Changes reflect immediately on the main website

### Main Website
- Countdown timer fetches event date from backend on load
- Falls back to default date (2026-02-16) if API fails
- Shows loading state while fetching

## Usage

### 1. Access Admin Dashboard
```
http://localhost:5174/event-settings
or
https://admin.dangal2k26.online/event-settings
```

### 2. Update Event Date
1. Login to admin dashboard
2. Click "Event Settings" in navigation
3. Enter event name (e.g., "Dangal 4.0")
4. Select date and time using the datetime picker
5. Click "Save Settings"

### 3. View on Main Website
- The countdown timer will automatically use the new date
- No page reload needed for users (they'll see it on next visit)

## API Endpoints

### Get Event Settings (Public)
```http
GET /api/event/settings

Response:
{
  "eventDate": "2026-02-16T00:00:00.000Z",
  "eventName": "Dangal 4.0"
}
```

### Update Event Settings (Admin Only)
```http
PUT /api/event/settings
Authorization: Admin cookie required

Request Body:
{
  "eventDate": "2026-02-16T00:00:00.000Z",
  "eventName": "Dangal 4.0"
}

Response:
{
  "message": "Event settings updated successfully",
  "eventDate": "2026-02-16T00:00:00.000Z",
  "eventName": "Dangal 4.0"
}
```

## Database Schema

```javascript
EventSettings {
  eventDate: Date (required),
  eventName: String (default: "Dangal 4.0"),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Files Created/Modified

### Backend
- `server/src/models/EventSettings.js` - Event settings model
- `server/src/routes/event.js` - Event API routes
- `server/src/index.js` - Added event routes

### Admin Dashboard
- `admin/src/pages/EventSettings.jsx` - Event settings page
- `admin/src/components/AdminLayout.jsx` - Layout with navigation
- `admin/src/pages/Dashboard.jsx` - Updated to use layout
- `admin/src/App.jsx` - Added event settings route

### Client
- `client/src/components/Countdown.tsx` - Fetches date from API

## Testing

### 1. Start Backend
```bash
cd server
npm run dev
```

### 2. Start Admin Dashboard
```bash
cd admin
npm run dev
```

### 3. Start Client
```bash
cd client
npm run dev
```

### 4. Test Flow
1. Go to http://localhost:5174/event-settings
2. Login with `admin@dangal` / `felisleo`
3. Change the event date to tomorrow
4. Save settings
5. Go to http://localhost:5173
6. Verify countdown shows correct time

## Default Behavior

- If no event settings exist in database, creates default:
  - Date: 2026-02-16 00:00:00
  - Name: Dangal 4.0
- If API call fails on client, uses hardcoded default date
- Only one active event settings document at a time

## Security

- Event settings GET endpoint is public (needed for countdown)
- Event settings UPDATE endpoint requires admin authentication
- Admin authentication uses JWT tokens in HTTP-only cookies

## Future Enhancements

- [ ] Multiple events support
- [ ] Event timezone configuration
- [ ] Countdown completion message
- [ ] Email notifications when event date changes
- [ ] Event history/archive
