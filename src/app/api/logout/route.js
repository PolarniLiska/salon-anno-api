import cookie from 'cookie';

export async function POST(req) {
  // Set cookie to expire in the past, effectively deleting it
  const serialized = cookie.serialize('authToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1, // Expire immediately
    path: '/',
  });

  return new Response(JSON.stringify({ message: '✅ Odhlášení úspěšné' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': serialized,
    },
  });
} 