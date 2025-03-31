// app/api/senders/[id]/confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { confirmBrevoSenderVerification } from "@/lib/brevo";

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
    const { code } = await request.json();
    
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return new NextResponse(JSON.stringify({ error: "Verification code is required" }), {
        status: 400,
      });
    }
    
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
    
    // If already verified, just return success
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
    
    // Try to confirm with the Brevo API using the correct OTP format
    const result = await confirmBrevoSenderVerification(brevoKey.apiKey, sender.email, code);
    
    if (result.success && result.verified) {
      // Update our database to reflect verified status
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
        message: "Sender successfully verified" 
      });
    } else if (result.success && !result.verified) {
      // The API accepted the request but verification is not complete yet
      return NextResponse.json({ 
        success: true, 
        verified: false,
        message: result.message || "Verification in progress. Please check status again in a few moments."
      });
    } else {
      // Something went wrong with the verification
      return NextResponse.json({ 
        success: false, 
        verified: false,
        error: result.error || "Verification failed. Please check the code and try again."
      });
    }
  } catch (error) {
    console.error("Error confirming sender verification:", error);
    
    return new NextResponse(JSON.stringify({ 
      error: "Failed to verify sender",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
    });
  }
}