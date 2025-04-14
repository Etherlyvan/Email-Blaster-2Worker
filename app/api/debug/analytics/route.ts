// app/api/debug/analytics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const { campaignId, contactId, event } = await request.json();
    
    if (!campaignId || !contactId || !event) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    // Find the delivery
    const delivery = await prisma.emailDelivery.findUnique({
      where: {
        campaignId_contactId: {
          campaignId,
          contactId
        }
      }
    });
    
    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }
    
    // Simulate event
    switch (event) {
      case 'delivered':
        await prisma.emailDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'DELIVERED',
          },
        });
        break;
        
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
            errorMessage: "Test bounce",
          },
        });
        break;
        
      default:
        return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Simulated ${event} event for campaign ${campaignId}, contact ${contactId}` 
    });
  } catch (error) {
    console.error("Error simulating event:", error);
    return NextResponse.json({ 
      error: "Failed to simulate event",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}