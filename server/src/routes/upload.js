import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
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
