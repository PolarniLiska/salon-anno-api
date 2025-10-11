import { serialize } from 'cookie';
import { handleCors, setCorsHeaders } from '../../../lib/cors.js';

export async function OPTIONS(req) {
  return handleCors(req);
}

export async function POST(req) {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  // Set cookie to expire in the past, effectively deleting it
  const serialized = serialize('authToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1, // Expire immediately
    path: '/',
  });

  return setCorsHeaders(new Response(JSON.stringify({ message: '✅ Odhlášení úspěšné' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': serialized,
    },
  }));
} 