import connectDB from '../../../lib/mongodb.js';
import User from '../../../models/User.js';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  await connectDB();

  const { token, newPassword } = await req.json();

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    return new Response(JSON.stringify({ error: 'Token je neplatný nebo expiroval' }), { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  return new Response(JSON.stringify({ message: '✅ Heslo bylo úspěšně změněno' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}