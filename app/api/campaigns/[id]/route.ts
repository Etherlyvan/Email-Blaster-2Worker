// app/api/campaigns/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

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
    const campaign = await prisma.campaign.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        group: true,
        brevoKey: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!campaign) {
      return new NextResponse(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
      });
    }
    
    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch campaign" }), {
      status: 500,
    });
  }
}

export async function PUT(
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
    const data = await request.json();
    
    // Verify the campaign exists and belongs to the user
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
    
    // Only allow updates to draft campaigns
    if (campaign.status !== 'DRAFT') {
      return new NextResponse(JSON.stringify({ error: "Only draft campaigns can be updated" }), {
        status: 400,
      });
    }
    
    // Update the campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        subject: data.subject,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        content: data.content,
        brevoKeyId: data.brevoKeyId,
        groupId: data.groupId,
        schedule: data.schedule ? new Date(data.schedule) : null,
      },
      include: {
        group: true,
        brevoKey: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to update campaign" }), {
      status: 500,
    });
  }
}

export async function DELETE(
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
    // Verify the campaign exists and belongs to the user
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
    
    // Only allow deletion of draft or scheduled campaigns
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return new NextResponse(JSON.stringify({ error: "Only draft or scheduled campaigns can be deleted" }), {
        status: 400,
      });
    }
    
    // Delete email deliveries first
    await prisma.emailDelivery.deleteMany({
      where: { campaignId: id },
    });
    
    // Delete the campaign
    await prisma.campaign.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to delete campaign" }), {
      status: 500,
    });
  }
}