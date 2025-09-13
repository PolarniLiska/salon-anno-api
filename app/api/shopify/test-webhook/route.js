import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb.js';
import Code from '../../../../models/Code.js';
import { handleCors, setCorsHeaders } from '../../../../lib/cors.js';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handleCors(req);
}

export async function POST(req) {
    try {
        console.log('Test webhook endpoint volán');
        
        // Simulace Shopify objednávky
        const testOrder = {
            id: 'TEST_' + Date.now(),
            email: 'test@example.com',
            line_items: [
                {
                    name: 'Online kurz přístup - Testovací objednávka',
                    price: '1500',
                    quantity: 1
                }
            ]
        };
        
        // Připojení k databázi
        await connectToDatabase();
        
        // Najít nejstarší nepoužitý kód
        const availableCode = await Code.findOne({ 
            isUsed: false 
        }).sort({ createdAt: 1 });
        
        if (!availableCode) {
            return setCorsHeaders(new NextResponse(JSON.stringify({ 
                error: 'Žádný dostupný kód nenalezen!',
                availableCodes: await Code.countDocuments({ isUsed: false })
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        
        // Označit kód jako použitý a přiřadit k testovací objednávce
        availableCode.isUsed = true;
        availableCode.shopifyOrderId = testOrder.id;
        availableCode.customerEmail = testOrder.email;
        availableCode.assignedAt = new Date();
        await availableCode.save();
        
        console.log(`TEST: Kód ${availableCode.code} přiřazen k testovací objednávce ${testOrder.id}`);
        
        return setCorsHeaders(new NextResponse(JSON.stringify({ 
            success: true,
            message: 'Test webhook úspěšně zpracován',
            assignedCode: availableCode.code,
            testOrderId: testOrder.id,
            customerEmail: testOrder.email,
            remainingCodes: await Code.countDocuments({ isUsed: false })
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
