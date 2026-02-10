import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account', // Force account selection
    hd: 'students.iiests.ac.in', // Restrict to IIEST domain
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        // Check if it's the JMCR_ONLY error
        if (err.message === 'JMCR_ONLY') {
          return res.redirect(`${process.env.CLIENT_URL}/register#jmcr_only`);
        }
        // Other authentication errors
        return res.redirect(`${process.env.CLIENT_URL}/register#auth_failed`);
      }
      
      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/register#auth_failed`);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set cookie (for same-domain requests)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: process.env.NODE_ENV === 'production' ? '.dangal2k26.online' : undefined,
      });

      // Redirect based on role with token in URL (for cross-domain)
      const redirectUrl = user.role === 'admin'
        ? `${process.env.ADMIN_URL}?token=${token}`
        : `${process.env.CLIENT_URL}/register?token=${token}#auth_success`;

      res.redirect(redirectUrl);
    })(req, res, next);
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      role: req.user.role,
    },
  });
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.dangal2k26.online' : undefined,
  });
  res.json({ message: 'Logged out successfully' });
});

export default router;
