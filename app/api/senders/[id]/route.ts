// app/api/senders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkBrevoSenderStatus, deleteBrevoSender } from "@/lib/brevo";

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
    
    return NextResponse.json(sender);
  } catch (error) {
    console.error("Error fetching sender:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch sender" }), {
      status: 500,
    });
  }
}

// Interface for Prisma errors
interface PrismaError {
  code: string;
  meta?: {
    target?: string[];
  };
  message?: string;
  clientVersion?: string;
}
// Type guard for Prisma errors
function isPrismaError(error: unknown): error is PrismaError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  );
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
    // Check if sender exists and belongs to user
    const sender = await prisma.brevoSender.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        campaigns: {
          select: {
            id: true,
            name: true,
          },
          take: 5, // Limit to 5 campaigns for the error message
        },
      },
    });
    
    if (!sender) {
      return new NextResponse(JSON.stringify({ error: "Sender not found" }), {
        status: 404,
      });
    }
    
    // Check if the sender is used in any campaigns
    if (sender.campaigns && sender.campaigns.length > 0) {
      // Create a list of campaign names for the error message
      const campaignNames = sender.campaigns.map(c => c.name);
      const additionalCount = sender.campaigns.length > 5 ? ` and ${sender.campaigns.length - 5} more` : '';
      
      return new NextResponse(JSON.stringify({ 
        error: `Cannot delete sender that is used in campaigns: ${campaignNames.join(', ')}${additionalCount}`,
        usedInCampaigns: true,
        campaigns: sender.campaigns
      }), {
        status: 400,
      });
    }
    
    // Find active Brevo key
    const brevoKey = await prisma.brevoKey.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });
    
    if (!brevoKey) {
      return new NextResponse(JSON.stringify({ error: "No active Brevo API key found" }), {
        status: 400,
      });
    }
    
    // Try to delete from Brevo
    let brevoDeleteResult = null;
    try {
      // Check if the sender exists in Brevo and get its ID
      const status = await checkBrevoSenderStatus(brevoKey.apiKey, sender.email);
      
      if (status.exists && status.id) {
        // Delete by ID if available
        console.log(`Attempting to delete sender ID ${status.id} from Brevo`);
        brevoDeleteResult = await deleteBrevoSender(brevoKey.apiKey, status.id);
        console.log(`Brevo deletion result:`, brevoDeleteResult);
      } else {
        console.log(`Sender ${sender.email} not found in Brevo, skipping API deletion`);
        brevoDeleteResult = { success: true, message: "Sender not found in Brevo" };
      }
    } catch (brevoError) {
      console.error("Error deleting sender from Brevo:", brevoError);
      // Continue with local deletion even if Brevo deletion fails
      brevoDeleteResult = { 
        success: false, 
        error: brevoError instanceof Error ? brevoError.message : "Unknown error" 
      };
    }
    
    // Delete the sender from our database
    await prisma.brevoSender.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Sender deleted successfully",
      brevoDeleteResult
    });
  } catch (error: unknown) {
    console.error("Error deleting sender:", error);
    
    if (isPrismaError(error)) {
      // Check for foreign key constraint errors
      if (error.code === 'P2003' || error.code === 'P2014') {
        return new NextResponse(JSON.stringify({ 
          error: "Cannot delete sender that is used in campaigns",
          usedInCampaigns: true
        }), {
          status: 400,
        });
      }
    }
    
    return new NextResponse(JSON.stringify({ 
      error: "Failed to delete sender",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
    });
  }
}