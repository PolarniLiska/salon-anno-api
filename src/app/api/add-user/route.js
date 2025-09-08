import connectDB from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import bcrypt from 'bcryptjs';
import { withAuth } from '../../../../lib/middleware.js';

async function handlePOST(req) {
  await connectDB();

  const passwordHash = await bcrypt.hash('testheslo123', 10);

  const newUser = new User({
    email: 'test2@salonanno.cz',
    passwordHash,
    activated: false,
    activationCode: null,
  });

  await newUser.save();

  return new Response(JSON.stringify({ message: '✅ Testovací uživatel vytvořen', user: newUser }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Chráněný endpoint - vyžaduje přihlášení
export const POST = withAuth(handlePOST);