// app/api/campaigns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { authOptions } from "../../../lib/auth";
import { sendToQueue, EMAIL_QUEUE, SCHEDULER_QUEUE } from "../../../lib/rabbitmq";
import { CampaignStatus } from "@prisma/client";


// Update the campaign schema to include brevoSenderId
const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Valid email is required"),
  content: z.string(), 
  brevoKeyId: z.string().min(1, "Brevo key is required"),
  brevoSenderId: z.string().optional(), // Add this line
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
    
    console.log("API - Creating campaign with params:", { 
      sendNow, 
      hasSchedule: !!schedule,
      scheduleTime: schedule ? new Date(schedule).toISOString() : null
    });
    
    // Additional validation for required fields
    if (!campaignData.subject || !campaignData.name || !campaignData.senderName || 
        !campaignData.senderEmail || !campaignData.brevoKeyId || !campaignData.groupId) {
      return new NextResponse(JSON.stringify({ 
        error: "Missing required fields for campaign creation" 
      }), {
        status: 400,
      });
    }
    
    // Determine the status based on sendNow and schedule
    let status: 'DRAFT' | 'SCHEDULED' | 'SENDING' = 'DRAFT';
    let scheduleDate = undefined;
    
    // PENTING: Prioritaskan jadwal jika ada
    if (schedule) {
      status = 'SCHEDULED';
      scheduleDate = new Date(schedule);
      
      // Make sure the schedule is in the future
      const now = new Date();
      if (scheduleDate <= now) {
        return new NextResponse(JSON.stringify({ 
          error: "Schedule date must be in the future" 
        }), {
          status: 400,
        });
      }
      
      // Force sendNow to false if there's a schedule
      console.log(`API - Campaign will be scheduled for ${scheduleDate.toISOString()}, not sending now`);
    } else if (sendNow) {
      status = 'SENDING';
      console.log(`API - Campaign will be sent immediately`);
    } else {
      console.log(`API - Campaign will be saved as draft`);
    }
    
    // Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        ...campaignData,
        status,
        schedule: scheduleDate,
        userId: session.user.id,
      },
    });
    
    console.log(`API - Campaign created with ID: ${campaign.id}, status: ${campaign.status}`);
    
    // If sending now (and no schedule), queue it for immediate processing
    if (status === 'SENDING') {
      console.log(`API - Sending campaign ${campaign.id} to EMAIL_QUEUE for immediate delivery`);
      await sendToQueue(EMAIL_QUEUE, { campaignId: campaign.id });
    } 
    // If scheduled, add to scheduler queue
    else if (status === 'SCHEDULED' && scheduleDate) {
      console.log(`API - Sending campaign ${campaign.id} to SCHEDULER_QUEUE for scheduled delivery at ${scheduleDate.toISOString()}`);
      await sendToQueue(SCHEDULER_QUEUE, { 
        campaignId: campaign.id,
        scheduledTime: scheduleDate.toISOString()
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
    return new NextResponse(JSON.stringify({ 
      error: "Failed to create campaign",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
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