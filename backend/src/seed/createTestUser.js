'use strict';

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'testuser@shringar.com' });
    if (existingUser) {
      console.log('⚠️  Test user already exists');
      console.log('📧 Email: testuser@shringar.com');
      console.log('🔑 Password: Test@123456');
      process.exit(0);
    }

    // Create test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'testuser@shringar.com',
      password: 'Test@123456',
      phone: '9876543210',
      role: 'user',
      isEmailVerified: true,
      isActive: true
    });

    console.log('✅ Test user created successfully');
    console.log('📧 Email: testuser@shringar.com');
    console.log('🔑 Password: Test@123456');
    console.log('👤 Name: Test User');
    console.log('📱 Phone: 9876543210');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
};

createTestUser();
