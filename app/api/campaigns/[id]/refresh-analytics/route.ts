// app/api/campaigns/[id]/refresh-analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEmailAnalytics } from "@/lib/brevo";

export async function POST(
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
    // Get the campaign
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
    
    if (!campaign.brevoKeyId) {
      return new NextResponse(JSON.stringify({ error: "Campaign has no Brevo key assigned" }), {
        status: 400,
      });
    }
    
    // Refresh analytics data
    const analyticsData = await getEmailAnalytics(campaign.brevoKeyId, id);
    
    return NextResponse.json({
      success: true,
      message: "Analytics refreshed successfully",
      stats: analyticsData.campaign.stats
    });
  } catch (error) {
    console.error("Error refreshing analytics:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to refresh analytics",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
    });
  }
}