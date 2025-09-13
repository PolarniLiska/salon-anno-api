import connectDB from '../../../../lib/mongodb.js';
import Code from '../../../../models/Code.js';
import User from '../../../../models/User.js';
import { ensureEnoughCodes } from '../../codes/seed/route.js';
import { withAuth } from '../../../../lib/middleware.js';
import { handleCors, setCorsHeaders } from '../../../../lib/cors.js';

export const dynamic = 'force-dynamic';

async function handlePOST(req) {
  await connectDB();

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return setCorsHeaders(new Response(JSON.stringify({ error: 'Email and code are required.' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    // Ověř, že uživatel aktivuje svůj vlastní účet
    if (req.user.email !== email) {
      return setCorsHeaders(new Response(JSON.stringify({ error: 'Můžete aktivovat pouze svůj vlastní účet.' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    // Find the code (kontrolujeme oba způsoby označení použití)
    const foundCode = await Code.findOne({ 
      code: code, 
      $and: [
        { $or: [{ used: false }, { used: { $exists: false } }] },
        { $or: [{ isUsed: false }, { isUsed: { $exists: false } }] }
      ]
    });
    if (!foundCode) {
      return setCorsHeaders(new Response(JSON.stringify({ error: 'Invalid or already used code.' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    // Find the user
    const user = await User.findOne({ email: email });
    if (!user) {
      return setCorsHeaders(new Response(JSON.stringify({ error: 'User not found.' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    // Activate user
    user.activated = true;
    
    // Mark code as used (označujeme oběma způsoby pro konzistenci)
    foundCode.used = true;
    foundCode.isUsed = true;
    foundCode.usedBy = email;
    foundCode.usedAt = new Date();
    
    // Save both documents
    await user.save();
    await foundCode.save();

    // Trigger code seeding check
    try {
      await ensureEnoughCodes();
    } catch (seedError) {
      console.error("Failed to run post-activation code seeding:", seedError);
      // Don't fail the whole request, just log the error.
    }

    return setCorsHeaders(new Response(JSON.stringify({ message: '✅ Course activated successfully.' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

  } catch (error) {
    console.error('Activation Error:', error);
    return setCorsHeaders(new Response(JSON.stringify({ error: 'Server error during activation.' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
}

export async function OPTIONS(req) {
  return handleCors(req);
}

// Chráněný endpoint - vyžaduje přihlášení (ale ne aktivaci, protože se aktivuje)
export const POST = withAuth(handlePOST); 