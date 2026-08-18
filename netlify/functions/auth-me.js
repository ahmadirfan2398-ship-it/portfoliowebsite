const jwt = require('jsonwebtoken');
const { connectDB, User, jsonRes } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonRes(200, {});
  if (event.httpMethod !== 'GET') return jsonRes(405, { ok: false, error: 'Method not allowed.' });

  try {
    const authHeader = event.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return jsonRes(401, { ok: false, error: 'Not logged in.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return jsonRes(401, { ok: false, error: 'Session expired — log in again.' });
    }

    await connectDB();

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return jsonRes(404, { ok: false, error: 'User not found.' });

    return jsonRes(200, { ok: true, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error('Me error:', err);
    return jsonRes(500, { ok: false, error: 'Could not load user.' });
  }
};
