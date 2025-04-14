// app/api/debug/brevo/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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
    const { senderId, code } = await request.json();
    
    if (!senderId || !code) {
      return new NextResponse(JSON.stringify({ 
        error: "senderId and code are required parameters" 
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
    
    // Convert code to a number
    const numericCode = parseInt(code, 10);
    if (isNaN(numericCode)) {
      return new NextResponse(JSON.stringify({ 
        error: "Code must be a valid number" 
      }), {
        status: 400,
      });
    }
    
    // Make direct API call to Brevo
    try {
      console.log(`Sending direct API request to validate sender ${senderId} with code ${numericCode}`);
      
      const response = await axios.put(
        `https://api.brevo.com/v3/senders/${senderId}/validate`,
        { otp: numericCode },
        {
          headers: {
            'api-key': brevoKey.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response data:`, response.data);
      
      return NextResponse.json({
        success: true,
        status: response.status,
        data: response.data
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error status: ${error.response?.status}`);
        console.error(`Error data:`, error.response?.data);
        
        return NextResponse.json({
          success: false,
          status: error.response?.status,
          error: error.response?.data?.message || error.message,
          data: error.response?.data
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Error in Brevo verify debug endpoint:", error);
    
    return new NextResponse(JSON.stringify({ 
      error: "Failed to make Brevo API request",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
    });
  }
}