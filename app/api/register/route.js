import connectDB from '../../../lib/mongodb.js';
import User from '../../../models/User.js';
import bcrypt from 'bcryptjs';
import { handleCors, setCorsHeaders } from '../../../lib/cors.js';

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(req) {
  return handleCors(req);
}

export async function POST(req) {
  try {
    console.log('Registrace uživatele - začátek');
    
    await connectDB();
    console.log('Databáze připojena');

    const { name, email, password } = await req.json();
    console.log('Registrace pro:', email);

    if (!name || !email || !password) {
      return setCorsHeaders(new Response(JSON.stringify({ error: 'Jméno, email a heslo jsou povinné' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), req);
    }

    if (!email.includes('@')) {
      return setCorsHeaders(new Response(JSON.stringify({ error: 'Neplatný email formát' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), req);
    }

    if (password.length < 6) {
      return setCorsHeaders(new Response(JSON.stringify({ error: 'Heslo musí mít alespoň 6 znaků' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), req);
    }

    console.log('Kontroluji existujícího uživatele');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Uživatel již existuje');
      return setCorsHeaders(new Response(JSON.stringify({ error: 'Uživatel už existuje' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), req);
    }

    console.log('Hashování hesla');
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('Vytváření nového uživatele');
    const newUser = new User({
      name,
      email,
      passwordHash,
      activated: false,
      activationCode: null,
    });

    await newUser.save();
    console.log('Uživatel uložen');

    return setCorsHeaders(new Response(JSON.stringify({ 
      message: '✅ Uživatel zaregistrován', 
      user: { name: newUser.name, email: newUser.email, activated: newUser.activated }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }), req);
    
  } catch (error) {
    console.error('Chyba při registraci:', error);
    return setCorsHeaders(new Response(JSON.stringify({ 
      error: 'Chyba serveru při registraci',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), req);
  }
}