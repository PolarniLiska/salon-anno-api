import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb.js';
import Code from '../../../../models/Code.js';
import User from '../../../../models/User.js';
import { handleCors, setCorsHeaders } from '../../../../lib/cors.js';
import { ensureEnoughCodes } from '../codes/seed/route.js';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handleCors(req);
}

export async function POST(req) {
    try {
        console.log('Aktivace kurzu - začátek');
        
        // Připojení k databázi
        await connectDB();
        console.log('Databáze připojena');
        
        // Získání dat z requestu
        const body = await req.text();
        console.log('Raw body:', body);
        
        const { email, code } = JSON.parse(body);
        console.log('Parsed data:', { email, code });
        
        if (!email || !code) {
            console.log('Chybí email nebo kód');
            return setCorsHeaders(new NextResponse(JSON.stringify({ 
                error: 'Email and code are required.' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        
        // Najít kód - jednodušší dotaz
        console.log('Hledám kód:', code);
        const foundCode = await Code.findOne({ code: code });
        
        console.log('Nalezený kód:', foundCode ? {
            code: foundCode.code,
            used: foundCode.used,
            isUsed: foundCode.isUsed,
            shopifyOrderId: foundCode.shopifyOrderId,
            usedBy: foundCode.usedBy
        } : 'Nenalezen');
        
        // Kontrola, zda kód není už použitý
        if (foundCode && (foundCode.used === true || foundCode.isUsed === true)) {
            console.log('Kód je již použitý');
            return setCorsHeaders(new NextResponse(JSON.stringify({ 
                error: 'Code already used.' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        
        if (!foundCode) {
            console.log('Kód nenalezen nebo již použit');
            return setCorsHeaders(new NextResponse(JSON.stringify({ 
                error: 'Invalid or already used code.' 
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        
        console.log('Kód nalezen:', foundCode.code);
        
        // Najít uživatele - jednodušší dotaz
        console.log('Hledám uživatele:', email);
        const user = await User.findOne({ email: email });
        if (!user) {
            console.log('Uživatel nenalezen');
            return setCorsHeaders(new NextResponse(JSON.stringify({ 
                error: 'User not found.' 
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        
        console.log('Uživatel nalezen:', user.email);
        
        // Aktivovat uživatele
        user.activated = true;
        await user.save();
        console.log('Uživatel aktivován');
        
        // Označit kód jako použitý
        foundCode.used = true;
        foundCode.isUsed = true;
        foundCode.usedBy = email;
        foundCode.usedAt = new Date();
        await foundCode.save();
        console.log('Kód označen jako použitý');
        
        // Automaticky vygenerovat nový kód pro udržení zásoby
        try {
            await ensureEnoughCodes();
            console.log('Zásoba kódů doplněna');
        } catch (error) {
            console.error('Chyba při doplňování zásoby kódů:', error);
            // Nechceme zablokovat aktivaci kvůli chybě v generování
        }
        
        return setCorsHeaders(new NextResponse(JSON.stringify({ 
            message: '✅ Course activated successfully.' 
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        
    } catch (error) {
        console.error('Chyba při aktivaci kurzu:', error);
        console.error('Error stack:', error.stack);
        
        return setCorsHeaders(new NextResponse(JSON.stringify({ 
            error: 'Server error during activation.',
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        }));
    }
}
