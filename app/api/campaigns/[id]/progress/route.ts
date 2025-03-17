// app/api/campaigns/[id]/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Updated for Next.js 15 with proper params typing
export async function GET(
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
    // Check if campaign exists and belongs to the user
    const campaign = await prisma.campaign.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!campaign) {
      return new NextResponse(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
      });
    }
    
    // Get delivery stats
    const deliveries = await prisma.emailDelivery.findMany({
      where: {
        campaignId: id,
      },
      select: {
        status: true,
      },
    });
    
    // Calculate stats
    const totalCount = deliveries.length;
    
    // Initialize the statusCounts object with all possible statuses set to 0
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      SENT: 0,
      DELIVERED: 0,
      OPENED: 0,
      CLICKED: 0,
      BOUNCED: 0,
      FAILED: 0
    };
    
    // Count the occurrences of each status
    deliveries.forEach(delivery => {
      statusCounts[delivery.status] = (statusCounts[delivery.status] || 0) + 1;
    });
    
    // Calculate progress percentage
    const processed = (statusCounts.SENT || 0) + (statusCounts.DELIVERED || 0) + 
                     (statusCounts.OPENED || 0) + (statusCounts.CLICKED || 0) + 
                     (statusCounts.BOUNCED || 0) + (statusCounts.FAILED || 0);
    
    const progress = totalCount > 0 ? Math.round((processed / totalCount) * 100) : 0;
    
    return NextResponse.json({
      campaignId: id,
      status: campaign.status,
      progress,
      totalCount,
      statusCounts,
    });
  } catch (error) {
    console.error("Error fetching campaign progress:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch campaign progress" }), {
      status: 500,
    });
  }
}