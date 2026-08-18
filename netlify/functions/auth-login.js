const jwt = require('jsonwebtoken');
const { connectDB, User, jsonRes, isValidEmail } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonRes(200, {});
  if (event.httpMethod !== 'POST') return jsonRes(405, { ok: false, error: 'Method not allowed.' });

  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return jsonRes(400, { ok: false, error: 'Email and password are required.' });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return jsonRes(401, { ok: false, error: 'Invalid email or password.' });
    }

    const matches = await user.comparePassword(password);
    if (!matches) {
      return jsonRes(401, { ok: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return jsonRes(200, { ok: true, token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    return jsonRes(500, { ok: false, error: 'Login failed. Please try again.' });
  }
};
