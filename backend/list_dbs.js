const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017');

const db = mongoose.connection;
db.once('open', async function () {
  try {
    const admin = db.getClient().db('admin');
    const databases = await admin.admin().listDatabases();
    console.log('Available databases:');
    databases.databases.forEach(d => {
      console.log(`  - ${d.name}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
});
