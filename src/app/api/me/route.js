import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import connectDB from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function GET(req) {
  await connectDB();
  const cookies = cookie.parse(req.headers.get('cookie') || '');
  const token = cookies.authToken;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id) {
        return new Response(JSON.stringify({ error: 'Invalid token payload' }), { status: 401 });
    }

    // Fetch fresh user data from DB
    const user = await User.findById(decoded.id).select('-passwordHash'); // Exclude password hash
    if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }
}