import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin@dangal' });

    if (existingAdmin) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    // Create default admin
    const admin = await Admin.create({
      username: 'admin@dangal',
      password: 'felisleo', // Will be hashed by pre-save hook
      role: 'admin',
      isActive: true,
    });

    console.log('Default admin created successfully!');
    console.log('Username: admin@dangal');
    console.log('Password: felisleo');
    console.log('Role: admin');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createDefaultAdmin();
