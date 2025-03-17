// app/api/brevo-keys/[id]/test-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import nodemailer from 'nodemailer';
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const testEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

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
    const data = await request.json();
    const validatedData = testEmailSchema.parse(data);
    
    // Retrieve the Brevo key
    const brevoKey = await prisma.brevoKey.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!brevoKey) {
      return new NextResponse(JSON.stringify({ error: "Brevo key not found" }), {
        status: 404,
      });
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: brevoKey.smtpUsername,
        pass: brevoKey.smtpPassword,
      },
    });
    
    // Send test email
    const mailOptions = {
      from: `"Email Campaign App" <${brevoKey.smtpUsername}>`,
      to: validatedData.to,
      subject: validatedData.subject,
      text: validatedData.message,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${validatedData.subject}</h2>
        <p>${validatedData.message}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is a test email sent from the Email Campaign App.</p>
      </div>`,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors }), {
        status: 400,
      });
    }
    
    return new NextResponse(JSON.stringify({ error: "Failed to send test email" }), {
      status: 500,
    });
  }
}