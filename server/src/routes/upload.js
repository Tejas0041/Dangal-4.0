import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter - MIME type:', file.mimetype);
    console.log('Multer fileFilter - Original name:', file.originalname);
    console.log('Multer fileFilter - Size:', file.size);
    
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      console.error('Multer fileFilter - Rejected: Not an image file');
      return cb(new Error('Only image files are allowed'), false);
    }
    console.log('Multer fileFilter - Accepted');
    cb(null, true);
  }
});

const uploadPdf = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for PDFs
  },
  fileFilter: (req, file, cb) => {
    // Accept PDFs only
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  }
});

// Upload image endpoint (admin only)
router.post('/image', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'dangal/halls',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    res.json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
});

// Upload payment screenshot endpoint (authenticated users)
router.post('/payment', authenticate, (req, res, next) => {
  console.log('=== PAYMENT UPLOAD REQUEST STARTED ===');
  console.log('User authenticated:', req.user?.email || 'No user');
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('=== MULTER ERROR ===');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error stack:', err.stack);
      
      if (err instanceof multer.MulterError) {
        console.error('Multer error code:', err.code);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: 'File too large. Maximum size is 5MB',
            errorCode: 'FILE_TOO_LARGE'
          });
        }
        return res.status(400).json({ 
          message: err.message,
          errorCode: err.code
        });
      }
      
      return res.status(400).json({ 
        message: err.message || 'File upload error',
        errorCode: 'UPLOAD_ERROR'
      });
    }
    
    next();
  });
}, async (req, res) => {
  try {
    console.log('=== MULTER PROCESSING COMPLETE ===');
    
    if (!req.file) {
      console.error('No file in request after multer processing');
      return res.status(400).json({ 
        message: 'No image file provided',
        errorCode: 'NO_FILE'
      });
    }

    console.log('File details:');
    console.log('  - Original name:', req.file.originalname);
    console.log('  - MIME type:', req.file.mimetype);
    console.log('  - Size:', req.file.size, 'bytes (', (req.file.size / 1024 / 1024).toFixed(2), 'MB)');
    console.log('  - Buffer length:', req.file.buffer.length);
    console.log('User:', req.user?.email);

    console.log('=== STARTING CLOUDINARY UPLOAD ===');
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'dangal/payments',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1600, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('=== CLOUDINARY ERROR ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error details:', JSON.stringify(error, null, 2));
            console.error('HTTP code:', error.http_code);
            reject(error);
          } else {
            console.log('=== CLOUDINARY SUCCESS ===');
            console.log('Secure URL:', result.secure_url);
            console.log('Public ID:', result.public_id);
            console.log('Format:', result.format);
            console.log('Width:', result.width);
            console.log('Height:', result.height);
            console.log('Bytes:', result.bytes);
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    console.log('=== PAYMENT UPLOAD COMPLETE ===');
    res.json({
      message: 'Payment screenshot uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('=== PAYMENT UPLOAD ERROR (CATCH BLOCK) ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    res.status(500).json({ 
      message: 'Failed to upload payment screenshot', 
      error: error.message,
      errorCode: 'CLOUDINARY_ERROR'
    });
  }
});

// Delete image endpoint (admin only)
router.delete('/image/:publicId', authenticateAdmin, async (req, res) => {
  try {
    const publicId = req.params.publicId.replace(/-/g, '/'); // Convert back to path format
    
    await cloudinary.uploader.destroy(publicId);
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

// Upload PDF endpoint (admin only)
router.post('/pdf', authenticateAdmin, uploadPdf.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file provided' });
    }

    console.log('Uploading PDF, file size:', req.file.size, 'bytes');
    console.log('Original filename:', req.file.originalname);

    // Upload to Cloudinary using 'auto' resource type
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'dangal/rulebooks',
          resource_type: 'auto', // Let Cloudinary auto-detect the resource type
          public_id: `rulebook_${Date.now()}`,
          access_mode: 'public',
          type: 'upload'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('PDF uploaded successfully');
            console.log('Secure URL:', result.secure_url);
            console.log('Public ID:', result.public_id);
            console.log('Resource type:', result.resource_type);
            console.log('Format:', result.format);
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    console.log('Final PDF URL:', result.secure_url);

    res.json({
      message: 'PDF uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ message: 'Failed to upload PDF', error: error.message });
  }
});

export default router;
