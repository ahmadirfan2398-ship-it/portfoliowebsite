const jwt = require('jsonwebtoken');
const { connectDB, User, jsonRes, isValidEmail } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonRes(200, {});
  if (event.httpMethod !== 'POST') return jsonRes(405, { ok: false, error: 'Method not allowed.' });

  try {
    const { name, email, password } = JSON.parse(event.body || '{}');

    if (!name || name.trim().length < 2) {
      return jsonRes(400, { ok: false, error: 'Please provide your name.' });
    }
    if (!email || !isValidEmail(email)) {
      return jsonRes(400, { ok: false, error: 'Please provide a valid email.' });
    }
    if (!password || password.length < 8) {
      return jsonRes(400, { ok: false, error: 'Password must be at least 8 characters.' });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return jsonRes(409, { ok: false, error: 'This email is already registered — try logging in.' });
    }

    const user = new User({ name: name.trim(), email: email.toLowerCase(), password });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return jsonRes(200, { ok: true, token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error('Signup error:', err);
    return jsonRes(500, { ok: false, error: 'Signup failed. Please try again.' });
  }
};
