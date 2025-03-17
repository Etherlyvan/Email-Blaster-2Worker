// app/api/webhooks/brevo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Verify webhook is from Brevo (implement proper verification)
    // This is a simplified example
    
    const { event, email, message_id } = data;
    console.log(`Received ${event} event for email: ${email}`);
    // Find the email delivery by message ID
    const delivery = await prisma.emailDelivery.findFirst({
      where: {
        messageId: message_id,
      },
      include: {
        contact: true,
      },
    });
    
    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }
    
    // Update based on event type
    switch (event) {
      case 'opened':
        await prisma.emailDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'OPENED',
            openedAt: new Date(),
          },
        });
        break;
        
      case 'clicked':
        await prisma.emailDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'CLICKED',
            clickedAt: new Date(),
          },
        });
        break;
        
      case 'bounced':
        await prisma.emailDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'BOUNCED',
            errorMessage: data.reason || 'Email bounced',
          },
        });
        break;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}