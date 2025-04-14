// app/api/senders/[id]/check-usage/route.ts 

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    // Check if sender exists and belongs to user
    const sender = await prisma.brevoSender.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!sender) {
      return new NextResponse(JSON.stringify({ error: "Sender not found" }), {
        status: 404,
      });
    }
    
    // Check if the sender is used in any campaigns
    const campaignsCount = await prisma.campaign.count({
      where: {
        userId: session.user.id,
        senderEmail: sender.email,
      },
    });
    
    // Get a sample of campaigns using this sender
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: session.user.id,
        senderEmail: sender.email,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
      take: 10,
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    return NextResponse.json({
      inUse: campaignsCount > 0,
      count: campaignsCount,
      campaigns: campaigns,
      canDelete: campaignsCount === 0,
    });
  } catch (error) {
    console.error("Error checking sender usage:", error);
    
    return new NextResponse(JSON.stringify({ 
      error: "Failed to check sender usage",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
    });
  }
}