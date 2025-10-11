import jwt from 'jsonwebtoken';
import { parse as parseCookie } from 'cookie';
import connectDB from '../../../lib/mongodb.js';
import User from '../../../models/User.js';
import { handleCors, setCorsHeaders } from '../../../lib/cors.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function OPTIONS(req) {
  return handleCors(req);
}

export async function GET(req) {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  await connectDB();
  const cookies = parseCookie(req.headers.get('cookie') || '');
  const token = cookies.authToken;

  if (!token) {
    return setCorsHeaders(new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 }), req);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id) {
        return setCorsHeaders(new Response(JSON.stringify({ error: 'Invalid token payload' }), { status: 401 }));
    }

    // Fetch fresh user data from DB
    const user = await User.findById(decoded.id).select('-passwordHash'); // Exclude password hash
    if (!user) {
        return setCorsHeaders(new Response(JSON.stringify({ error: 'User not found' }), { status: 404 }));
    }

    return setCorsHeaders(new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }), req);
  } catch (err) {
    return setCorsHeaders(new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 }));
  }
}