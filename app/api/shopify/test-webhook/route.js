import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb.js';
import Code from '../../../../models/Code.js';
import { handleCors, setCorsHeaders } from '../../../../lib/cors.js';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handleCors(req);
}

export async function POST(req) {
    try {
        console.log('Test webhook endpoint volán');
        
        // Zkusit získat email z request body, jinak použít default
        let testEmail = 'test@example.com';
        try {
            const body = await req.json();
            if (body.email && body.email.includes('@')) {
                testEmail = body.email;
                console.log(`Používám zadaný email: ${testEmail}`);
            }
        } catch (e) {
            // Pokud není JSON body, použij default email
        }
        
        // Simulace Shopify objednávky
        const testOrder = {
            id: 'TEST_' + Date.now(),
            email: testEmail,
            line_items: [
                {
                    name: 'Online kurz přístup - Testovací objednávka',
                    price: '1500',
                    quantity: 1
                }
            ]
        };
        
        // Připojení k databázi
        await connectDB();
        
        // Najít nejstarší nepoužitý a nepřiřazený kód
        const availableCode = await Code.findOne({ 
            $and: [
                { $or: [{ used: false }, { used: { $exists: false } }] },
                { $or: [{ isUsed: false }, { isUsed: { $exists: false } }] },
                { $or: [{ shopifyOrderId: null }, { shopifyOrderId: { $exists: false } }] } // Nepřiřazený
            ]
        }).sort({ createdAt: 1 });
        
        if (!availableCode) {
            return setCorsHeaders(new NextResponse(JSON.stringify({ 
                error: 'Žádný dostupný kód nenalezen!',
                availableCodes: await Code.countDocuments({ 
                    $and: [
                        { $or: [{ used: false }, { used: { $exists: false } }] },
                        { $or: [{ isUsed: false }, { isUsed: { $exists: false } }] }
                    ]
                })
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        
        // Označit kód jako PŘIŘAZENÝ (ne použitý!) k testovací objednávce
        availableCode.shopifyOrderId = testOrder.id;
        availableCode.customerEmail = testOrder.email;
        availableCode.assignedAt = new Date();
        // NEOZNAČUJEME jako used/isUsed - to se stane až při aktivaci!
        await availableCode.save();
        
        console.log(`TEST: Kód ${availableCode.code} přiřazen k testovací objednávce ${testOrder.id}`);
        
        return setCorsHeaders(new NextResponse(JSON.stringify({ 
            success: true,
            message: 'Test webhook úspěšně zpracován',
            assignedCode: availableCode.code,
            testOrderId: testOrder.id,
            customerEmail: testOrder.email,
            remainingCodes: await Code.countDocuments({ 
                $and: [
                    { $or: [{ used: false }, { used: { $exists: false } }] },
                    { $or: [{ isUsed: false }, { isUsed: { $exists: false } }] }
                ]
            })
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        
    } catch (error) {
        console.error('Chyba při testování webhook:', error);
        return setCorsHeaders(new NextResponse(JSON.stringify({ 
            error: 'Chyba při testování webhook',
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        }));
    }
}
