import connectDB from '../../../../../lib/mongodb.js';
import Code from '../../../../../models/Code.js';

// Helper to generate a random code
function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Function to ensure there are enough codes - moved to separate function
async function ensureEnoughCodes() {
  await connectDB();
  const targetCount = 10;
  
  try {
    const unusedCodesCount = await Code.countDocuments({ used: false });
    
    if (unusedCodesCount < targetCount) {
      const codesToGenerate = targetCount - unusedCodesCount;
      let generatedCount = 0;

      for (let i = 0; i < codesToGenerate; i++) {
        let isCodeCreated = false;
        // Retry loop in case of a (very rare) duplicate key collision
        while (!isCodeCreated) {
          try {
            const code = generateRandomCode();
            await Code.create({ code: code, used: false });
            isCodeCreated = true;
          } catch (error) {
            if (error.code === 11000) { // Duplicate key error
              console.log('Duplicate code generated, retrying...');
              continue;
            }
            throw error; // Re-throw other errors
          }
        }
        generatedCount++;
      }
      
      return { message: `✅ Generated ${generatedCount} new codes.` };
    }
    
    return { message: 'Sufficient codes exist.' };
  } catch (error) {
    console.error('Code seeding error:', error);
    throw new Error('Failed to seed codes.');
  }
}

export async function POST(req) {
  try {
    const result = await ensureEnoughCodes();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 