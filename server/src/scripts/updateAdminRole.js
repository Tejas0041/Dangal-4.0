import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const updateAdminRole = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Update all admins with superadmin role to admin role
    const result = await Admin.updateMany(
      { role: 'superadmin' },
      { $set: { role: 'admin' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} admin(s) from superadmin to admin role`);

    // Show all admins
    const admins = await Admin.find({}, 'username role isActive');
    console.log('\nCurrent admins:');
    admins.forEach(admin => {
      console.log(`- ${admin.username}: ${admin.role} (${admin.isActive ? 'Active' : 'Inactive'})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin role:', error);
    process.exit(1);
  }
};

updateAdminRole();
