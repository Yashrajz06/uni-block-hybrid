const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Faculty = require('../src/models/Faculty');
const Admin = require('../src/models/Admin');

const fixProfiles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users without profiles
    const users = await User.find();
    
    for (const user of users) {
      let profile = null;
      
      if (user.role === 'student') {
        profile = await Student.findOne({ userId: user._id });
        if (!profile) {
          console.log(`\n⚠️  Student profile missing for user: ${user.email}`);
          console.log('   Please create profile manually or re-register with all required fields.');
        }
      } else if (user.role === 'faculty') {
        profile = await Faculty.findOne({ userId: user._id });
        if (!profile) {
          console.log(`\n⚠️  Faculty profile missing for user: ${user.email}`);
          console.log('   Please create profile manually or re-register with all required fields.');
        }
      } else if (user.role === 'admin') {
        profile = await Admin.findOne({ userId: user._id });
        if (!profile) {
          console.log(`\n⚠️  Admin profile missing for user: ${user.email}`);
          console.log('   Please create profile manually or re-register with all required fields.');
        }
      }
      
      if (profile) {
        console.log(`✓ Profile exists for ${user.email} (${user.role})`);
      }
    }

    console.log('\n✅ Profile check complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixProfiles();


