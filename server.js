const express = require('express');
const bcrypt  = require('bcrypt');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'users.json');

const ALLOWED_ORIGINS = [
  'https://snapcat-login.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

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

// POST /api/login
// If account doesn't exist → create it and log in.
// If account exists → log in with any password (testing mode).
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  let user = findUser(email);

  if (!user) {
    // New user — save their credentials automatically
    const passwordHash = await bcrypt.hash(password, 12);
    const users = loadUsers();
    users.push({
      id: Date.now().toString(),
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
    return res.json({ message: 'Account created and logged in!', email });
  }

  // Existing user — accept any password in testing mode
  return res.json({ message: 'Login successful', email: user.email });
});

// GET /admin/users — see all saved credentials
app.get('/admin/users', (req, res) => {
  const users = loadUsers().map(({ id, email, createdAt }) => ({ id, email, createdAt }));
  res.json({ count: users.length, users });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
