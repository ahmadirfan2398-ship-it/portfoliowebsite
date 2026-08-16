// Portfolio backend — Brevo contact form + MongoDB user auth
// Requires Node.js 18+ (global fetch). Run: npm install && npm start

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const dns = require('dns');
const User = require('./models/User');
require('dotenv').config();

// Some ISP/router DNS servers refuse MongoDB's SRV lookups, which breaks
// the connection with "querySrv ECONNREFUSED". Using public DNS fixes it.
dns.setServers(['1.1.1.1', '8.8.8.8', '9.9.9.9']);

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
} else {
  console.warn('WARNING: MONGODB_URI not set in .env — auth endpoints will fail.');
}

// Protect sensitive files from being downloaded as static files
app.use((req, res, next) => {
  const blocked = ['/.env', '/server.js', '/package.json', '/package-lock.json', '/.env.example', '/.gitignore'];
  if (blocked.includes(req.path.toLowerCase())) {
    return res.status(404).send('Not found');
  }
  next();
});

// Serve the portfolio site itself (index.html, css/, js/)
app.use(express.static(__dirname, { dotfiles: 'deny', index: 'index.html' }));

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ============================================
   AUTH — MongoDB users (signup / login / me)
   ============================================ */
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ ok: false, error: 'Not logged in.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Session expired — log in again.' });
  }
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ ok: false, error: 'Please provide your name.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Please provide a valid email.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ ok: false, error: 'This email is already registered — try logging in.' });
    }

    const user = new User({ name: name.trim(), email: email.toLowerCase(), password });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ ok: false, error: 'Signup failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    const matches = await user.comparePassword(password);
    if (!matches) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });
    res.json({ ok: true, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ ok: false, error: 'Could not load user.' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ ok: false, error: 'Please provide your name.' });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: 'Please provide a valid email.' });
  }
  if (!message || message.trim().length < 5) {
    return res.status(400).json({ ok: false, error: 'Message is too short.' });
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.CONTACT_TO_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!process.env.BREVO_API_KEY) {
    return res.status(500).json({ ok: false, error: 'BREVO_API_KEY is not set in .env' });
  }

  const payload = {
    sender: { name: 'Portfolio Website', email: senderEmail },
    to: [{ email: toEmail, name: 'Ahmad' }],
    replyTo: { email, name },
    subject: 'New message from ' + name + ' (portfolio website)',
    htmlContent:
      '<h2>New contact form message</h2>' +
      '<p><strong>Name:</strong> ' + escapeHtml(name) + '</p>' +
      '<p><strong>Email:</strong> <a href="mailto:' + escapeHtml(email) + '">' + escapeHtml(email) + '</a></p>' +
      '<p><strong>Message:</strong></p>' +
      '<blockquote style="border-left:3px solid #5b8cff;padding-left:12px;margin-left:0;color:#333;">' +
      escapeHtml(message).replace(/\n/g, '<br>') + '</blockquote>'
  };

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('Brevo error:', data);
      return res.status(500).json({ ok: false, error: data.message || 'Brevo API error' });
    }

    res.json({ ok: true, messageId: data.messageId });
  } catch (err) {
    console.error('Send failed:', err);
    res.status(500).json({ ok: false, error: 'Could not send the email.' });
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
  if (process.env.BREVO_API_KEY) {
    const k = process.env.BREVO_API_KEY;
    console.log('BREVO_API_KEY loaded: prefix=' + k.slice(0, 9) + '… length=' + k.length + ' startsWithXkeysib=' + k.startsWith('xkeysib-'));
  } else {
    console.warn('BREVO_API_KEY: NOT SET in .env');
  }
  if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY.startsWith('paste_your')) {
    console.warn('WARNING: BREVO_API_KEY is not set properly — contact form will fail. Add your real key and restart.');
  }
  if (!process.env.MONGODB_URI) {
    console.warn('WARNING: MONGODB_URI not set — signup/login will fail. Add it and restart.');
  }
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET not set — auth tokens will be insecure. Add it and restart.');
  }
});
