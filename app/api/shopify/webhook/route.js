import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb.js';
import Code from '../../../../models/Code.js';
import User from '../../../../models/User.js';
import { handleCors, setCorsHeaders } from '../../../../lib/cors.js';
import crypto from 'crypto';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

// Shopify webhook secret - nastavte v .env.local
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

// Resend email service
const resend = new Resend(process.env.RESEND_API_KEY);

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
        
        // Verifikace webhook podpisu (dočasně vypnuto pro test)
        if (SHOPIFY_WEBHOOK_SECRET && !verifyShopifyWebhook(body, signature)) {
            console.error('Neplatný Shopify webhook podpis');
            return setCorsHeaders(new NextResponse('Unauthorized', { status: 401 }));
        }
        
        if (!SHOPIFY_WEBHOOK_SECRET) {
            console.warn('⚠️ SHOPIFY_WEBHOOK_SECRET není nastaveno - webhook bez verifikace!');
        }
        
        const order = JSON.parse(body);
        console.log('Shopify webhook obdržen:', order.id);
        
        // Kontrola, zda objednávka obsahuje online kurz nebo testovací produkty
        const hasOnlineCourse = order.line_items && order.line_items.some(item => {
            const name = item.name.toLowerCase();
            return (name.includes('online kurz') && name.includes('přístup')) ||
                   name.includes('online kurz přístup') ||
                   name.includes('kurz přístup') ||
                   // Testovací produkty z Shopify
                   name.includes('čisticí mléko essential') ||
                   name.includes('čisticí pěna essential') ||
                   name.includes('balance tonikum essential');
        });
        
        if (!hasOnlineCourse) {
            console.log(`Objednávka ${order.id} neobsahuje online kurz ani testovací produkty, ignoruji. Produkty:`, 
                order.line_items ? order.line_items.map(item => item.name) : 'Žádné produkty');
            return setCorsHeaders(new NextResponse('OK', { status: 200 }));
        }
        
        console.log(`Objednávka ${order.id} obsahuje online kurz nebo testovací produkty, zpracovávám...`);
        
        // Pro testovací objednávky z Shopify použij tvůj email
        if (order.id.toString().startsWith('820982911946154500')) {
            console.log(`🧪 TESTOVACÍ objednávka - měním email na tvůj`);
            order.email = 'jan.spiska@gmail.com'; // Změň na svůj email
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
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY není nastaveno - email nebude odeslán');
            console.log(`
=== EMAIL PRO ZÁKAZNÍKA ===
To: ${email}
Subject: Váš přístupový kód k online kurzu

Dobrý den,

děkujeme za nákup online kurzu v Salónu Anno!

Váš přístupový kód: ${code}

Kód zadejte při registraci, nebo přihlášení na našem webu pro aktivaci přístupu k videím.

Objednávka č.: ${order.id}

S pozdravem,
Salón Anno
=============================
            `);
            return;
        }

        const { data, error } = await resend.emails.send({
            from: 'Salón Anno <noreply@salonanno.cz>',
            to: [email],
            subject: 'Váš přístupový kód k online kurzu',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Dobrý den,</h2>
                    
                    <p>děkujeme za nákup online kurzu v <strong>Salónu Anno</strong>!</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Váš přístupový kód:</h3>
                        <div style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 2px;">${code}</div>
                    </div>
                    
                    <p>Tento kód zadejte při registraci nebo přihlášení na našem webu pro aktivaci přístupu k videím.</p>
                    
                    <p><strong>Objednávka č.:</strong> ${order.id}</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    
                    <p style="color: #666; font-size: 14px;">
                        S pozdravem,<br>
                        <strong>Salón Anno</strong>
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Chyba při odesílání emailu:', error);
        } else {
            console.log('Email úspěšně odeslán:', data);
        }
        
    } catch (error) {
        console.error('Chyba při odesílání emailu:', error);
        // Email chyba by neměla zablokovat webhook
    }
}
