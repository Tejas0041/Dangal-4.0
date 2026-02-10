# Cloudinary Setup Guide for Dangal Admin Panel

## Overview
The admin panel now supports image uploads for Hall/Hostel management using Cloudinary. Images are uploaded securely through the backend server.

## Setup Steps

### 1. Create a Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. After signing in, you'll be on the Dashboard

### 2. Get Your Credentials
From the Cloudinary Dashboard, note down:
- **Cloud Name**: Found at the top of the dashboard
- **API Key**: Found in the "Account Details" section
- **API Secret**: Found in the "Account Details" section (keep this secret!)

### 3. Configure Environment Variables

#### Server (.env)
Update `server/.env` with your Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dangal2k26
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

⚠️ **IMPORTANT**: Never commit your `.env` file to version control. The API Secret must remain private.

### 4. Install Dependencies

```bash
cd server
npm install
```

This will install the required packages:
- `cloudinary`: Cloudinary SDK
- `multer`: File upload middleware

### 5. Restart the Server
After updating the `.env` file, restart the backend server:

```bash
cd server
npm run dev
```

## Architecture

### Server-Side Upload (Secure)
- Images are uploaded from the admin panel to the backend server
- Server validates the file (type, size)
- Server uploads to Cloudinary using API credentials
- Only the Cloudinary URL is sent back to the frontend
- API credentials never exposed to the client

### Upload Flow
1. Admin selects an image in the admin panel
2. Image is sent to `/api/upload/image` endpoint
3. Server validates and uploads to Cloudinary
4. Cloudinary URL is returned and saved in database
5. Image is displayed using the Cloudinary URL

## Features

### Image Upload
- **File Selection**: Click the upload area to select an image
- **File Validation**: 
  - Only image files (PNG, JPG, WEBP, etc.) are accepted
  - Maximum file size: 5MB
  - Validated on both client and server
- **Automatic Optimization**: 
  - Images are automatically resized to max 800x600
  - Quality is optimized
  - Format is auto-selected (WebP when supported)
- **Preview**: Uploaded images are displayed immediately
- **Remove**: Click the "Remove" button to delete the uploaded image

### Image Display
- Hall/Hostel cards show the uploaded image at the top
- Images are displayed with proper aspect ratio (cover fit)
- If no image is uploaded, only the hall name and type are shown

## Security Features

1. **Server-Side Upload**: All uploads go through the backend
2. **Authentication Required**: Only authenticated admins can upload
3. **File Validation**: Type and size checked on server
4. **Credentials Protected**: API keys never exposed to frontend
5. **Folder Organization**: Images stored in `dangal/halls` folder

## API Endpoints

### Upload Image
```
POST /api/upload/image
Authorization: Admin only
Content-Type: multipart/form-data
Body: { image: File }
Response: { url: string, publicId: string }
```

### Delete Image
```
DELETE /api/upload/image/:publicId
Authorization: Admin only
Response: { message: string }
```

## Troubleshooting

### Upload Fails
- Check if Cloudinary credentials are correct in `server/.env`
- Ensure the server is running
- Verify the file size is under 5MB
- Check server console for error messages
- Ensure admin is authenticated

### Images Not Displaying
- Verify the Cloudinary URL is saved correctly in the database
- Check if the image URL is accessible (open it in a new tab)
- Ensure Cloudinary account is active
- Check browser console for CORS errors

### Environment Variables Not Working
- Restart the server after changing `.env`
- Ensure variable names are correct (no `VITE_` prefix on server)
- Check for typos in variable names

### Authentication Errors
- Ensure you're logged in as admin
- Check if admin session is valid
- Try logging out and logging back in

## Free Tier Limits

Cloudinary free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 transformations per month

This should be more than sufficient for the Dangal admin panel.

## Image Optimization

Images are automatically optimized with:
- **Max dimensions**: 800x600 pixels
- **Quality**: Auto (Cloudinary chooses best quality/size ratio)
- **Format**: Auto (WebP for modern browsers, fallback for others)
- **Folder**: `dangal/halls`

## Support

For Cloudinary-specific issues, refer to:
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK Guide](https://cloudinary.com/documentation/node_integration)
