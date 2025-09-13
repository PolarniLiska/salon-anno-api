import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb.js';
import Code from '../../../../models/Code.js';
import User from '../../../../models/User.js';
import { handleCors, setCorsHeaders } from '../../../../lib/cors.js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Shopify webhook secret - nastavte v .env.local
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

function verifyShopifyWebhook(data, signature) {
    if (!SHOPIFY_WEBHOOK_SECRET) {
        console.error('SHOPIFY_WEBHOOK_SECRET není nastaveno');
        return false;
    }
    
    const hmac = crypto.createHmac('sha256', SHOPIFY_WEBHOOK_SECRET);
    hmac.update(data, 'utf8');
    const hash = hmac.digest('base64');
    
    return crypto.timingSafeEqual(Buffer.from(hash, 'base64'), Buffer.from(signature, 'base64'));
}

export async function OPTIONS(req) {
    return handleCors(req);
}

export async function POST(req) {
    try {
        // Získání raw body pro verifikaci
        const body = await req.text();
        const signature = req.headers.get('x-shopify-hmac-sha256');
        
        // Verifikace webhook podpisu
        if (!verifyShopifyWebhook(body, signature)) {
            console.error('Neplatný Shopify webhook podpis');
            return setCorsHeaders(new NextResponse('Unauthorized', { status: 401 }));
        }
        
        const order = JSON.parse(body);
        console.log('Shopify webhook obdržen:', order.id);
        
        // Kontrola, zda objednávka obsahuje "Online kurz přístup"
        const hasOnlineCourse = order.line_items.some(item => 
            item.name.toLowerCase().includes('online kurz') && 
            item.name.toLowerCase().includes('přístup')
        );
        
        if (!hasOnlineCourse) {
            console.log('Objednávka neobsahuje online kurz, ignoruji');
            return setCorsHeaders(new NextResponse('OK', { status: 200 }));
        }
        
        // Připojení k databázi
        await connectDB();
        
        // Najít nejstarší nepoužitý a nepřiřazený kód
        const availableCode = await Code.findOne({ 
            $and: [
                { $or: [{ used: false }, { used: { $exists: false } }] },
                { $or: [{ isUsed: false }, { isUsed: { $exists: false } }] },
                { $or: [{ shopifyOrderId: null }, { shopifyOrderId: { $exists: false } }] } // Nepřiřazený
            ]
        }).sort({ createdAt: 1 }); // Nejstarší první
        
        if (!availableCode) {
            console.error('Žádný dostupný kód nenalezen!');
            // Můžeme zde implementovat automatické generování nového kódu
            return setCorsHeaders(new NextResponse('No codes available', { status: 500 }));
        }
        
        // Označit kód jako PŘIŘAZENÝ (ne použitý!) k objednávce
        availableCode.shopifyOrderId = order.id;
        availableCode.customerEmail = order.email;
        availableCode.assignedAt = new Date();
        // NEOZNAČUJEME jako used/isUsed - to se stane až při aktivaci!
        await availableCode.save();
        
        console.log(`Kód ${availableCode.code} přiřazen k objednávce ${order.id}`);
        
        // TODO: Poslat email zákazníkovi s kódem
        // Zde můžeme implementovat odeslání emailu s kódem
        await sendCodeEmail(order.email, availableCode.code, order);
        
        return setCorsHeaders(new NextResponse(JSON.stringify({ 
            success: true, 
            code: availableCode.code,
            orderId: order.id 
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        
    } catch (error) {
        console.error('Chyba při zpracování Shopify webhook:', error);
        return setCorsHeaders(new NextResponse('Internal Server Error', { status: 500 }));
    }
}

// Funkce pro odeslání emailu s kódem
async function sendCodeEmail(email, code, order) {
    try {
        // Zde můžeme implementovat odeslání emailu
        // Například pomocí Nodemailer, SendGrid, nebo jiné služby
        console.log(`Email by měl být odeslán na ${email} s kódem: ${code}`);
        
        // Pro testování můžeme použít console.log
        console.log(`
=== EMAIL PRO ZÁKAZNÍKA ===
To: ${email}
Subject: Váš přístupový kód k online kurzu

Dobrý den,

děkujeme za nákup online kurzu v Salónu Anno!

Váš přístupový kód: ${code}

Tento kód zadejte při registraci nebo přihlášení na našem webu pro aktivaci přístupu k videím.

Objednávka č.: ${order.id}

S pozdravem,
Salón Anno
=============================
        `);
        
    } catch (error) {
        console.error('Chyba při odesílání emailu:', error);
        // Email chyba by neměla zablokovat webhook
    }
}
