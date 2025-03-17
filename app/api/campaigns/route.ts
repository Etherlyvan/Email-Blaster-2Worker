// app/api/campaigns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { authOptions } from "../../../lib/auth";
import { sendToQueue, EMAIL_QUEUE, SCHEDULER_QUEUE } from "../../../lib/rabbitmq";
import { CampaignStatus } from "@prisma/client";


const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Valid email is required"),
  content: z.string(), 
  brevoKeyId: z.string().min(1, "Brevo key is required"),
  groupId: z.string().min(1, "Contact group is required"),
  schedule: z.string().datetime().optional(),
  sendNow: z.boolean().optional(),
});

/**
 * GET handler for fetching campaigns
 * Supports optional status filtering
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    
    // Build the where clause with proper typing
    const whereClause: {
      userId: string;
      status?: CampaignStatus;
    } = {
      userId: session.user.id
    };
    
    // Only add status filter if provided and valid
    if (status) {
      // Validate that status is a valid CampaignStatus value
      if (!isValidCampaignStatus(status)) {
        return new NextResponse(JSON.stringify({ 
          error: "Invalid status parameter" 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      // Fixed: Removed unnecessary type assertion
      whereClause.status = status;
    }
    
    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      include: {
        group: true,
        brevoKey: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to fetch campaigns",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * POST handler for creating new campaigns
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const json = await request.json();
    const validatedData = campaignSchema.parse(json);
    const { sendNow, schedule, ...campaignData } = validatedData;
    
    // Determine the status based on sendNow and schedule
    let status: 'DRAFT' | 'SCHEDULED' | 'SENDING' = 'DRAFT';
    
    if (sendNow) {
      status = 'SENDING';
    } else if (schedule) {
      status = 'SCHEDULED';
    }
    
    // Create the campaign (note that htmlContent field is removed)
    const campaign = await prisma.campaign.create({
      data: {
        ...campaignData,
        status,
        schedule: schedule ? new Date(schedule) : undefined,
        userId: session.user.id,
      },
    });
    
    // If sending now, queue it for immediate processing
    if (sendNow) {
      await sendToQueue(EMAIL_QUEUE, { campaignId: campaign.id });
    } 
    // If scheduled, add to scheduler queue
    else if (schedule) {
      await sendToQueue(SCHEDULER_QUEUE, { 
        campaignId: campaign.id,
        scheduledTime: schedule
      });
    }
    
    return NextResponse.json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors }), {
        status: 400,
      });
    }
    
    console.error("Error creating campaign:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to create campaign" }), {
      status: 500,
    });
  }
}

/**
 * Helper function to validate if a string is a valid CampaignStatus
 */
function isValidCampaignStatus(status: string): status is CampaignStatus {
  const validStatuses: CampaignStatus[] = ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED'];
  return validStatuses.includes(status as CampaignStatus);
}