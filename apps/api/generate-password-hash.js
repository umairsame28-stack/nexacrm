// Quick script to generate bcrypt hash for the password
const bcrypt = require('bcrypt');

const password = 'umairqasim2';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n✅ Password Hash Generated:\n');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this hash in the SQL INSERT statement.\n');
});
