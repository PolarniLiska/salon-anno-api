import connectDB from '../../../../lib/mongodb.js';
import Code from '../../../../models/Code.js';
import User from '../../../../models/User.js';
import { ensureEnoughCodes } from '../../codes/seed/route.js';
import { withAuth } from '../../../../lib/middleware.js';

async function handlePOST(req) {
  await connectDB();

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code are required.' }), { status: 400 });
    }

    // Ověř, že uživatel aktivuje svůj vlastní účet
    if (req.user.email !== email) {
      return new Response(JSON.stringify({ error: 'Můžete aktivovat pouze svůj vlastní účet.' }), { status: 403 });
    }

    // Find the code
    const foundCode = await Code.findOne({ code: code, used: false });
    if (!foundCode) {
      return new Response(JSON.stringify({ error: 'Invalid or already used code.' }), { status: 404 });
    }

    // Find the user
    const user = await User.findOne({ email: email });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found.' }), { status: 404 });
    }
    
    // Activate user
    user.activated = true;
    
    // Mark code as used
    foundCode.used = true;
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

    return new Response(JSON.stringify({ message: '✅ Course activated successfully.' }), { status: 200 });

  } catch (error) {
    console.error('Activation Error:', error);
    return new Response(JSON.stringify({ error: 'Server error during activation.' }), { status: 500 });
  }
}

// Chráněný endpoint - vyžaduje přihlášení (ale ne aktivaci, protože se aktivuje)
export const POST = withAuth(handlePOST); 