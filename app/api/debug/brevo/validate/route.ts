// app/api/debug/brevo/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    
    // Make direct API call to Brevo using fetch API
    console.log(`Sending direct API request to validate sender ${senderId} with code ${numericCode}`);
    
    const response = await fetch(`https://api.brevo.com/v3/senders/${senderId}/validate`, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'api-key': brevoKey.apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ otp: numericCode })
    });
    
    console.log(`Response status: ${response.status}`);
    
    // Try to parse response as JSON
    // Define a type for the response data to fix the TypeScript error
    interface ResponseData {
      message?: string;
      [key: string]: unknown;
    }
    
    let responseData: ResponseData = {};
    try {
      responseData = await response.json() as ResponseData;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) { // Use underscore instead of 'e' to fix the ESLint error
      console.log("No JSON response body or empty response");
    }
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        status: response.status,
        data: responseData
      });
    } else {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: responseData.message || `API returned status ${response.status}`,
        data: responseData
      });
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