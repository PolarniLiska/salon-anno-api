import jwt from 'jsonwebtoken';
import { parse as parseCookie } from 'cookie';
import connectDB from './mongodb.js';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware pro ověření přihlášení uživatele
 * @param {Request} req 
 * @returns {Object|null} - Vrací user objekt nebo null
 */
export async function authenticateUser(req) {
  await connectDB();
  
  const cookies = parseCookie(req.headers.get('cookie') || '');
  const token = cookies.authToken;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id) {
      return null;
    }

    // Získej aktuální data uživatele z DB
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return null;
    }

    return user;
  } catch (err) {
    return null;
  }
}

/**
 * Middleware pro kontrolu, zda je uživatel přihlášený
 * @param {Request} req 
 * @returns {Response|null} - Vrací error response nebo null (pokračuj)
 */
export async function requireAuth(req) {
  const user = await authenticateUser(req);
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Nejste přihlášen. Přihlaste se prosím.' }), 
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Přidej uživatele do request objektu pro další použití
  req.user = user;
  return null; // Pokračuj dál
}

/**
 * Middleware pro kontrolu, zda je uživatel přihlášený A aktivovaný
 * @param {Request} req 
 * @returns {Response|null} - Vrací error response nebo null (pokračuj)
 */
export async function requireActivatedUser(req) {
  // Nejdřív zkontroluj přihlášení
  const authError = await requireAuth(req);
  if (authError) {
    return authError;
  }

  // Zkontroluj aktivaci
  if (!req.user.activated) {
    return new Response(
      JSON.stringify({ 
        error: 'Váš účet není aktivován. Aktivujte si účet pomocí kódu z objednávky.' 
      }), 
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return null; // Pokračuj dál
}

/**
 * Wrapper pro API route s ochranou přihlášení
 * @param {(...args: any[]) => any} handler - API route handler
 * @returns {(...args: any[]) => any} - Chráněný API route handler
 */
export function withAuth(handler) {
  return async function(req, ...args) {
    const authError = await requireAuth(req);
    if (authError) {
      return authError;
    }
    
    return handler(req, ...args);
  };
}

/**
 * Wrapper pro API route s ochranou přihlášení + aktivace
 * @param {(...args: any[]) => any} handler - API route handler
 * @returns {(...args: any[]) => any} - Chráněný API route handler
 */
export function withActivatedUser(handler) {
  return async function(req, ...args) {
    const authError = await requireActivatedUser(req);
    if (authError) {
      return authError;
    }
    
    return handler(req, ...args);
  };
}