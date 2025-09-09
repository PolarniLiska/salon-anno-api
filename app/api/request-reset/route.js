import connectDB from '../../../lib/mongodb.js';
import User from '../../../models/User.js';
import crypto from 'crypto';

export async function POST(req) {
  await connectDB();

  const { email } = await req.json();

  const user = await User.findOne({ email });
  if (!user) {
    return new Response(JSON.stringify({ error: 'Uživatel nenalezen' }), { status: 404 });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hodina

  user.resetToken = token;
  user.resetTokenExpiry = expiry;
  await user.save();

  // V ostré verzi bys poslal email
  return new Response(JSON.stringify({
    message: '✅ Reset token vygenerován',
    token: token,
    url: `http://localhost:3000/reset?token=${token}`
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
