import connectDB from '../../../../lib/mongodb.js';

export async function GET() {
  await connectDB();
  return new Response(JSON.stringify({ message: '✅ Database connection works!' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}