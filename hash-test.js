const bcrypt = require('bcryptjs');

const password = 'Kinju$6114'; // <-- type carefully, this is the source of truth

bcrypt.hash(password, 10).then(async (hash) => {
  console.log('Generated hash:', hash);

  // Immediately verify it against itself, in the same script
  const isValid = await bcrypt.compare(password, hash);
  console.log('Self-check (should always be true):', isValid);
});