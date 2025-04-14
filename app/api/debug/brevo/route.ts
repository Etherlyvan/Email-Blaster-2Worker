// app/api/debug/brevo/route.ts
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
    const { action, senderId, email, code } = await request.json();
    
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
    
    // Test different Brevo API endpoints directly
    let response;
    let result;
    
    switch (action) {
      case 'listSenders':
        response = await axios.get('https://api.brevo.com/v3/senders', {
          headers: {
            'api-key': brevoKey.apiKey,
            'Content-Type': 'application/json'
          }
        });
        result = response.data;
        break;
        
      case 'getSender':
        if (!senderId) {
          return NextResponse.json({ error: "senderId is required" }, { status: 400 });
        }
        
        response = await axios.get(`https://api.brevo.com/v3/senders/${senderId}`, {
          headers: {
            'api-key': brevoKey.apiKey,
            'Content-Type': 'application/json'
          }
        });
        result = response.data;
        break;
        
      case 'createSender':
        if (!email) {
          return NextResponse.json({ error: "email is required" }, { status: 400 });
        }
        
        response = await axios.post('https://api.brevo.com/v3/senders', {
          name: email.split('@')[0],
          email
        }, {
          headers: {
            'api-key': brevoKey.apiKey,
            'Content-Type': 'application/json'
          }
        });
        result = response.data;
        break;
        
      case 'validateSender':
        if (!senderId || !code) {
          return NextResponse.json({ error: "senderId and code are required" }, { status: 400 });
        }
        
        const numericCode = parseInt(code, 10);
        if (isNaN(numericCode)) {
          return NextResponse.json({ error: "code must be a number" }, { status: 400 });
        }
        
        try {
          response = await axios.put(`https://api.brevo.com/v3/senders/${senderId}/validate`, {
            otp: numericCode
          }, {
            headers: {
              'api-key': brevoKey.apiKey,
              'Content-Type': 'application/json'
            }
          });
          result = response.data;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return NextResponse.json({
              error: "Validation failed",
              status: error.response?.status,
              data: error.response?.data
            });
          }
          throw error;
        }
        break;
        
      case 'deleteSender':
        if (!senderId) {
          return NextResponse.json({ error: "senderId is required" }, { status: 400 });
        }
        
        try {
          response = await axios.delete(`https://api.brevo.com/v3/senders/${senderId}`, {
            headers: {
              'api-key': brevoKey.apiKey,
              'Accept': 'application/json'
            }
          });
          result = { success: true, status: response.status };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return NextResponse.json({
              error: "Deletion failed",
              status: error.response?.status,
              data: error.response?.data
            });
          }
          throw error;
        }
        break;
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      action,
      result
    });
  } catch (error) {
    console.error("Error in Brevo debug endpoint:", error);
    
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: "Brevo API error",
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: "Failed to execute Brevo API request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}