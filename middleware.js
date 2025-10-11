import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://www.salonanno.cz',
  'https://salonanno.cz',
  'http://localhost:3000',
  'http://localhost:8080'
];

export function middleware(request) {
  // Získej origin z requestu
  let origin = request.headers.get('origin');
  
  // Pokud origin není v povoleném seznamu, nastav první povolený
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    origin = ALLOWED_ORIGINS[0];
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin',
      },
    });
  }

  // Continue with the request and add CORS headers to the response
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Vary', 'Origin');
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};

