import connectDB from '../../../lib/mongodb.js';
import Code from '../../../models/Code.js';
import { withAuth } from '../../../lib/middleware.js';

// Helper to generate a random code
function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function handlePOST(req) {
  await connectDB();

  try {
    const body = await req.json();
    let codeValue = body.code;

    // If no code is provided, generate one
    if (!codeValue) {
      codeValue = generateRandomCode();
    }

    const newCode = new Code({ code: codeValue });
    await newCode.save();

    return new Response(JSON.stringify({ message: '✅ Code created', code: newCode }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Handle potential duplicate code error
    if (error.code === 11000) {
      return new Response(JSON.stringify({ error: 'Code already exists.' }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Failed to create code.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Chráněný endpoint - vyžaduje přihlášení
export const POST = withAuth(handlePOST);