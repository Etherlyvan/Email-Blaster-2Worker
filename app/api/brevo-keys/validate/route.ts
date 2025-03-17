// app/api/brevo-keys/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import axios from 'axios';
import nodemailer from 'nodemailer';
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const { apiKey, smtpUsername, smtpPassword } = await request.json();
    
    // Test API key
    let apiKeyValid = false;
    try {
      const response = await axios.get('https://api.brevo.com/v3/account', {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      apiKeyValid = response.status === 200;
    } catch {
      // No parameter needed since we're not using it
      apiKeyValid = false;
    }
    
    // Test SMTP credentials
    let smtpValid = false;
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: smtpUsername,
          pass: smtpPassword,
        },
      });
      
      // Verify connection configuration
      await transporter.verify();
      smtpValid = true;
    } catch {
      // No parameter needed since we're not using it
      smtpValid = false;
    }
    
    return NextResponse.json({
      apiKeyValid,
      smtpValid,
      success: apiKeyValid && smtpValid
    });
  } catch (error) {
    console.error("Error validating Brevo credentials:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to validate credentials",
      apiKeyValid: false,
      smtpValid: false,
      success: false
    }), {
      status: 500,
    });
  }
}