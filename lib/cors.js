// CORS middleware pro API routes
export function setCorsHeaders(response, requestOrOrigin = null) {
  // Získej origin z requestu nebo použij přímo string
  let origin = '*';
  if (requestOrOrigin) {
    if (typeof requestOrOrigin === 'string') {
      origin = requestOrOrigin;
    } else if (requestOrOrigin.headers) {
      origin = requestOrOrigin.headers.get('origin') || '*';
    }
  }
  
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Vary', 'Origin'); // Důležité pro cache
  return response;
}

export function handleCors(request) {
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') || '*';
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
  return null;
}

