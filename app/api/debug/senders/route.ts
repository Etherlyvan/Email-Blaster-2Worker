// app/api/debug/senders/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listAllBrevoSenders } from "@/lib/brevo";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
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
    
    // Get all senders from Brevo
    const result = await listAllBrevoSenders(brevoKey.apiKey);
    
    if (!result.success) {
      return new NextResponse(JSON.stringify({ 
        error: result.error || "Failed to fetch senders from Brevo" 
      }), {
        status: 500,
      });
    }
    
    return NextResponse.json({
      success: true,
      senders: result.senders
    });
  } catch (error) {
    console.error("Error fetching Brevo senders:", error);
    
    return new NextResponse(JSON.stringify({ 
      error: "Failed to fetch Brevo senders",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
    });
  }
}