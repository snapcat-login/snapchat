const express = require('express');
const bcrypt  = require('bcrypt');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());

function loadUsers() {
  if (!fs.existsSync(DB)) return [];
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch { return []; }
}

function saveUsers(users) {
  fs.writeFileSync(DB, JSON.stringify(users, null, 2));
}

function findUser(email) {
  return loadUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });
  let user = findUser(email);
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 12);
    const users = loadUsers();
    users.push({ id: Date.now().toString(), email: email.toLowerCase().trim(), passwordHash, createdAt: new Date().toISOString() });
    saveUsers(users);
    return res.json({ message: 'Account created and logged in!', email });
  }
  return res.json({ message: 'Login successful', email: user.email });
});

app.get('/admin/users', (req, res) => {
  const users = loadUsers().map(({ id, email, createdAt }) => ({ id, email, createdAt }));
  res.json({ count: users.length, users });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
