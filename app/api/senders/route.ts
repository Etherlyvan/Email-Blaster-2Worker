// app/api/senders/route.ts 

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBrevoSender } from "@/lib/brevo";
import { z } from "zod";

// Updated type for Prisma errors to better match actual structure
interface PrismaError {
  code: string;
  meta?: {
    target?: string[];
  };
  message?: string;
  clientVersion?: string;
}

// Updated type guard for Prisma errors
function isPrismaError(error: unknown): error is PrismaError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  );
}


// Define schema for a single sender
const senderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

// Define schema for bulk senders
const bulkSendersSchema = z.object({
  senders: z.array(senderSchema),
});

// Check if this exact email+name combination already exists
async function checkExactSenderExists(userId: string, email: string, name: string) {
  return prisma.brevoSender.findFirst({
    where: {
      userId,
      email,
      name
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const data = await request.json();
    
    // Check if we're dealing with a single sender or bulk senders
    if (data.senders && Array.isArray(data.senders)) {
      // Bulk senders
      const validatedData = bulkSendersSchema.parse(data);
      const senders = validatedData.senders;
      
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
      
      // Process each sender
      const results = [];
      const skippedSenders = [];
      
      for (const sender of senders) {
        try {
          // Check if this exact email+name combination already exists
          const existingSender = await checkExactSenderExists(
            session.user.id, 
            sender.email, 
            sender.name
          );
          
          if (existingSender) {
            // Skip this sender as it already exists with the same email and name
            skippedSenders.push({
              email: sender.email,
              name: sender.name,
              reason: "Sender with this exact email and name already exists"
            });
            continue;
          }
          
          // Create in Brevo first
          const brevoResult = await createBrevoSender(brevoKey.apiKey, sender.name, sender.email);
          
          // Create the sender in our database
          const dbSender = await prisma.brevoSender.create({
            data: {
              name: sender.name,
              email: sender.email,
              userId: session.user.id,
              verificationStatus: "PENDING",
              isVerified: false
            },
          });
          
          results.push({
            ...dbSender,
            brevoSuccess: brevoResult.success
          });
        } catch (error) {
          console.error(`Error creating sender ${sender.email}:`, error);
          
          // Add to skipped senders
          skippedSenders.push({
            email: sender.email,
            name: sender.name,
            reason: "Error creating sender: " + (error instanceof Error ? error.message : "Unknown error")
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        successful: results.length,
        total: senders.length,
        skipped: skippedSenders.length,
        senders: results,
        skippedSenders: skippedSenders
      });
    } else {
      // Single sender
      const validatedData = senderSchema.parse(data);
      
      // Check if sender already exists with this exact email and name
      const existingSender = await checkExactSenderExists(
        session.user.id, 
        validatedData.email, 
        validatedData.name
      );
      
      if (existingSender) {
        return new NextResponse(JSON.stringify({ 
          error: "Sender with this exact email and name already exists" 
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
      
      // Create in Brevo first
      const brevoResult = await createBrevoSender(brevoKey.apiKey, validatedData.name, validatedData.email);
      
      // Create the sender in our database
      const sender = await prisma.brevoSender.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          userId: session.user.id,
          verificationStatus: "PENDING",
          isVerified: false
        },
      });
      
      return NextResponse.json({
        ...sender,
        brevoSuccess: brevoResult.success
      });
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors }), {
        status: 400,
      });
    }
    
    console.error("Error creating sender:", error);
    
    // Check if it's a unique constraint error with proper typing
    if (isPrismaError(error) && error.code === 'P2002') {
      // Now TypeScript knows error.meta exists on PrismaError
      const fields = error.meta?.target || [];
      
      if (Array.isArray(fields) && fields.includes('email') && fields.includes('name') && fields.includes('userId')) {
        return new NextResponse(JSON.stringify({ 
          error: "A sender with this exact email and name already exists"
        }), {
          status: 400,
        });
      } else {
        return new NextResponse(JSON.stringify({ 
          error: "This sender already exists"
        }), {
          status: 400,
        });
      }
    }
    
    return new NextResponse(JSON.stringify({ error: "Failed to create sender" }), {
      status: 500,
    });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const senders = await prisma.brevoSender.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(senders);
  } catch (error) {
    console.error("Error fetching senders:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch senders" }), {
      status: 500,
    });
  }
}