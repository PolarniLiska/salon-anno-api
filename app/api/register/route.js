import connectDB from '../../../lib/mongodb.js';
import User from '../../../models/User.js';
import bcrypt from 'bcryptjs';
import { handleCors, setCorsHeaders } from '../../../lib/cors.js';

// Handle CORS preflight
export async function OPTIONS(req) {
  return handleCors(req);
}

export async function POST(req) {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  await connectDB();

  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return new Response(JSON.stringify({ error: 'Jméno, email a heslo jsou povinné' }), { status: 400 });
  }

  if (!email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Neplatný email formát' }), { status: 400 });
  }

  if (password.length < 6) {
    return new Response(JSON.stringify({ error: 'Heslo musí mít alespoň 6 znaků' }), { status: 400 });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return new Response(JSON.stringify({ error: 'Uživatel už existuje' }), { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    passwordHash,
    activated: false,
    activationCode: null,
  });

  await newUser.save();

  return new Response(JSON.stringify({ message: '✅ Uživatel zaregistrován', user: newUser }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}