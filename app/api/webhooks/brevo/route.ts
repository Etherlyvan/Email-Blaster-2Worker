// app/api/webhooks/brevo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EmailStatus } from "@prisma/client"; // Import EmailStatus enum from Prisma

// Define a type for the update data
interface EmailDeliveryUpdate {
  status?: EmailStatus;
  openedAt?: Date;
  clickedAt?: Date;
  errorMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Extract main webhook data
    const { event, email, message_id } = data;
    console.log(`Received ${event} event for email: ${email}, message ID: ${message_id}`);
    
    // Basic validation
    if (!event || !message_id) {
      return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 });
    }
    
    // Find the email delivery by message ID
    const delivery = await prisma.emailDelivery.findFirst({
      where: {
        messageId: message_id,
      },
      include: {
        contact: true,
        campaign: true,
      },
    });
    
    if (!delivery) {
      console.log(`Delivery not found for message ID: ${message_id}`);
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }
    
    console.log(`Found delivery for campaign: ${delivery.campaign.name}, contact: ${delivery.contact.email}`);
    
    // Update based on event type
    let updateData: EmailDeliveryUpdate = {};
    
    switch (event) {
      case 'delivered':
        updateData = {
          status: 'DELIVERED',
        };
        break;
        
      case 'opened':
        updateData = {
          status: 'OPENED',
          openedAt: new Date(),
        };
        break;
        
      case 'clicked':
        updateData = {
          status: 'CLICKED',
          clickedAt: new Date(),
        };
        break;
        
      case 'bounced':
        updateData = {
          status: 'BOUNCED',
          errorMessage: data.reason || 'Email bounced',
        };
        break;
        
      case 'complaint':
        updateData = {
          status: 'FAILED',
          errorMessage: 'Recipient marked as spam',
        };
        break;
        
      case 'blocked':
        updateData = {
          status: 'FAILED',
          errorMessage: 'Email was blocked by recipient server',
        };
        break;
        
      default:
        console.log(`Unknown event type: ${event}, not processing`);
        return NextResponse.json({ message: "Event type not supported" });
    }
    
    // Only update if we have data to update
    if (Object.keys(updateData).length > 0) {
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: updateData,
      });
      console.log(`Updated delivery status to ${updateData.status} for message ID: ${message_id}`);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Processed ${event} event for message ID: ${message_id}`
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ 
      error: "Failed to process webhook",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}