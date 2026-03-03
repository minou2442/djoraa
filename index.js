require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Placeholder for authentication
app.post('/api/login', (req, res) => {
  // TODO: verify credentials, issue JWT
  const user = { id: 1, clinic_id: 1, role: 'superadmin' };
  const token = jwt.sign(user, process.env.JWT_SECRET || 'changeme', { expiresIn: '1h' });
  res.json({ token });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DJORAA API listening on port ${PORT}`);
});
