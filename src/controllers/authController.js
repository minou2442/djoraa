const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user');

// TODO: replace permission loading with DB lookups

function generateAccessToken(user) {
  const payload = {
    id: user.id,
    clinic_id: user.clinic_id,
    role: user.role,
    permissions: user.permissions
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'changeme', { expiresIn: '1h' });
}

async function login(req, res) {
  const { username, password } = req.body;
  const user = await userModel.findByUsername(username);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = generateAccessToken(user);
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || 'changeme', { expiresIn: '7d' });
  res.json({ accessToken, refreshToken });
}

function refreshToken(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Refresh token required' });
  jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'changeme', async (err, data) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });
    // look up user id in DB
    const user = await userModel.getById(data.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  });
}

module.exports = { login, refreshToken };
