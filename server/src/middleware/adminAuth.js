import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.adminToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);

    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive admin' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid admin token' });
  }
};
