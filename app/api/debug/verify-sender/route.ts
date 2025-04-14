// app/api/debug/verify-sender/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import axios from "axios";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const { email, name } = await request.json();
    
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
    
    // Test direct API call
    const response = await axios.post(
      'https://api.brevo.com/v3/senders',
      { name, email },
      {
        headers: {
          'api-key': brevoKey.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return NextResponse.json({
      success: true,
      apiResponse: response.data
    });
  } catch (error) {
    console.error("Debug verification error:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Debug verification failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
    });
  }
}