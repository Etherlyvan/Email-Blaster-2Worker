// app/api/senders/[id]/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requestBrevoSenderVerification } from "@/lib/brevo";

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
    // Log the verification request
    console.log(`Verification request received for sender ID: ${id}`);
    
    const sender = await prisma.brevoSender.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!sender) {
      console.log(`Sender ${id} not found`);
      return new NextResponse(JSON.stringify({ error: "Sender not found" }), {
        status: 404,
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
      console.log('No active Brevo key found');
      return new NextResponse(JSON.stringify({ error: "No active Brevo API key found" }), {
        status: 400,
      });
    }
    
    // Request verification
    console.log(`Requesting verification for sender ${sender.email}`);
    const result = await requestBrevoSenderVerification(brevoKey.apiKey, sender.name, sender.email);
    
    console.log('Verification request result:', result);
    
    if (result.success) {
      // Update sender status
      await prisma.brevoSender.update({
        where: { id },
        data: { 
          verificationStatus: result.isVerified ? "VERIFIED" : "VERIFICATION_EMAIL_SENT",
          isVerified: result.isVerified || false
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        message: result.message || "Verification process initiated"
      });
    } else {
      console.error('Verification request failed:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error || "Failed to verify sender"
      });
    }
  } catch (error) {
    console.error("Error verifying sender:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to verify sender",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
    });
  }
}