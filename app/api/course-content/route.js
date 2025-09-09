import connectDB from '../../../lib/mongodb.js';
import { withActivatedUser } from '../../../lib/middleware.js';

// Simulovaný obsah kurzu
const courseContent = [
  {
    id: 1,
    title: "Úvod do tetování obočí",
    content: "Detailní návod k základům tetování obočí...",
    videoUrl: "https://example.com/video1",
    duration: "15 minut"
  },
  {
    id: 2,
    title: "Výběr správné techniky",
    content: "Jak vybrat tu nejlepší techniku pro každého klienta...",
    videoUrl: "https://example.com/video2", 
    duration: "22 minut"
  },
  {
    id: 3,
    title: "Praktická ukázka",
    content: "Krok za krokem celý proces tetování...",
    videoUrl: "https://example.com/video3",
    duration: "45 minut"
  }
];

async function handleGET(req) {
  await connectDB();
  
  // Tento obsah je dostupný jen pro aktivované uživatele
  return new Response(JSON.stringify({ 
    message: 'Obsah kurzu',
    content: courseContent,
    userEmail: req.user.email // middleware přidal uživatele do req objektu
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Chráněný endpoint - vyžaduje přihlášení + aktivaci
export const GET = withActivatedUser(handleGET);