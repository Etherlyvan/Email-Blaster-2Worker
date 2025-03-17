// app/api/campaigns/[id]/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendToQueue, EMAIL_QUEUE } from "@/lib/rabbitmq";

// Updated for Next.js 15 with proper params typing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params promise to get the actual id
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const campaignId = id;
    console.log(`Received request to send campaign ${campaignId} immediately`);
    
    // Check if campaign exists and belongs to the user
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
        userId: session.user.id,
      },
    });
    
    if (!campaign) {
      console.error(`Campaign ${campaignId} not found or does not belong to user ${session.user.id}`);
      return new NextResponse(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
      });
    }
    
    // Check if campaign is in a state that can be sent
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      console.error(`Campaign ${campaignId} cannot be sent because its status is ${campaign.status}`);
      return new NextResponse(JSON.stringify({ 
        error: "Campaign cannot be sent. It must be in DRAFT or SCHEDULED status." 
      }), {
        status: 400,
      });
    }
    
    console.log(`Updating campaign ${campaignId} status to SENDING`);
    
    // Update campaign status to SENDING
    await prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data: {
        status: 'SENDING',
      },
    });
    
    console.log(`Sending campaign ${campaignId} to EMAIL_QUEUE for processing`);
    
    // Send to email queue
    await sendToQueue(EMAIL_QUEUE, { campaignId });
    
    console.log(`Campaign ${campaignId} successfully queued for sending`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending campaign:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to send campaign" }), {
      status: 500,
    });
  }
}