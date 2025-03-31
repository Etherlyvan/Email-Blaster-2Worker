// app/api/senders/[id]/check/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkBrevoSenderStatus } from "@/lib/brevo";

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
    
    // If already verified in our database, just return success
    if (sender.isVerified) {
      return NextResponse.json({ 
        success: true, 
        verified: true,
        message: "Sender is already verified" 
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
    
    // Check with Brevo - try up to 3 times with a delay
    console.log(`Checking Brevo status for sender ${sender.email}`);
    let isVerified = false;
    let status;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Verification status check attempt ${attempt}/3`);
      status = await checkBrevoSenderStatus(brevoKey.apiKey, sender.email);
      
      if (status.isVerified) {
        isVerified = true;
        break;
      }
      
      // Wait before trying again
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    if (isVerified) {
      console.log(`Sender ${sender.email} is verified in Brevo, updating database`);
      // Update our database if Brevo says it's verified
      const updatedSender = await prisma.brevoSender.update({
        where: { id },
        data: { 
          isVerified: true,
          verificationStatus: "VERIFIED"
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        verified: true,
        sender: updatedSender,
        message: "Sender is verified" 
      });
    }
    
    // If the sender doesn't exist in Brevo anymore, we should prompt to re-add it
    if (status && !status.exists) {
      return NextResponse.json({
        success: true,
        verified: false,
        exists: false,
        message: "This sender is not found in Brevo. Please try adding it again."
      });
    }
    
    console.log(`Sender ${sender.email} is not verified in Brevo`);
    return NextResponse.json({ 
      success: true, 
      verified: false,
      message: "Sender is not verified yet. Please complete the verification process." 
    });
  } catch (error) {
    console.error("Error checking sender status:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to check sender status",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
    });
  }
}