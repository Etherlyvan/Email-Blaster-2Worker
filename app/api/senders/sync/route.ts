// app/api/senders/sync/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrevoSenders } from "@/lib/brevo";

// Define a proper type for Brevo sender
interface BrevoSender {
  email: string;
  name?: string;
  active?: boolean;
  id?: number | string;
}

// Define a type for database sender
interface DbSender {
  id: string;
  email: string;
  isVerified: boolean;
}

// Define the type for the processed senders
interface ProcessedSender {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  verificationStatus: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST() {
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
    const brevoSendersResult = await getBrevoSenders(brevoKey.apiKey);
    
    if (!brevoSendersResult.success) {
      return new NextResponse(JSON.stringify({ 
        error: brevoSendersResult.error || "Failed to fetch senders from Brevo" 
      }), {
        status: 500,
      });
    }
    
    // Process senders from Brevo
    return await processSenders(session.user.id, brevoSendersResult.senders);
  } catch (error) {
    console.error("Error syncing senders from Brevo:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to sync senders from Brevo",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
    });
  }
}

// Separate function to reduce cognitive complexity
async function processSenders(userId: string, brevoSenders: BrevoSender[]) {
  // Get all senders from our database
  const dbSenders = await prisma.brevoSender.findMany({
    where: { userId },
  });
  
  // Process each sender from Brevo
  const newSenders: ProcessedSender[] = [];
  const updatedSenders: ProcessedSender[] = [];
  
  // Using separate functions to further reduce cognitive complexity
  await processNewAndUpdatedSenders(brevoSenders, dbSenders, userId, newSenders, updatedSenders);
  
  return NextResponse.json({
    success: true,
    message: `Synced senders from Brevo. Added ${newSenders.length} new senders and updated ${updatedSenders.length} existing senders.`,
    newSenders,
    updatedSenders,
    totalBrevoSenders: brevoSenders.length
  });
}

// Function to process new and updated senders
async function processNewAndUpdatedSenders(
  brevoSenders: BrevoSender[],
  dbSenders: DbSender[],
  userId: string,
  newSenders: ProcessedSender[],
  updatedSenders: ProcessedSender[]
) {
  for (const brevoSender of brevoSenders) {
    // Skip if missing required fields
    if (!brevoSender.email) {
      continue;
    }
    
    // Check if this sender already exists in our database
    const existingDbSender = findExistingSender(dbSenders, brevoSender.email);
    
    if (!existingDbSender) {
      // Handle new sender
      await handleNewSender(brevoSender, userId, newSenders);
    } else if (shouldUpdateSender(existingDbSender, brevoSender)) {
      // Handle existing sender that needs updating
      await handleExistingSender(existingDbSender, brevoSender, updatedSenders);
    }
  }
}

// Find existing sender in database
function findExistingSender(
  dbSenders: DbSender[],
  email: string
): DbSender | undefined {
  return dbSenders.find(s => s.email.toLowerCase() === email.toLowerCase());
}

// Check if sender needs to be updated
function shouldUpdateSender(
  dbSender: DbSender,
  brevoSender: BrevoSender
): boolean {
  return dbSender.isVerified !== (brevoSender.active ?? false);
}

// Handle creation of new sender
async function handleNewSender(
  brevoSender: BrevoSender,
  userId: string,
  newSenders: ProcessedSender[]
) {
  try {
    const newSender = await prisma.brevoSender.create({
      data: {
        name: brevoSender.name ?? brevoSender.email.split('@')[0],
        email: brevoSender.email,
        userId,
        isVerified: brevoSender.active ?? false,
        verificationStatus: brevoSender.active ? "VERIFIED" : "PENDING"
      },
    });
    
    newSenders.push(newSender as ProcessedSender);
  } catch (error) {
    console.error(`Error creating sender ${brevoSender.email}:`, error);
    // Continue with other senders even if one fails
  }
}

// Handle updating existing sender
async function handleExistingSender(
  existingDbSender: DbSender,
  brevoSender: BrevoSender,
  updatedSenders: ProcessedSender[]
) {
  try {
    const updatedSender = await prisma.brevoSender.update({
      where: { id: existingDbSender.id },
      data: {
        isVerified: brevoSender.active ?? false,
        verificationStatus: brevoSender.active ? "VERIFIED" : "PENDING"
      },
    });
    
    updatedSenders.push(updatedSender as ProcessedSender);
  } catch (error) {
    console.error(`Error updating sender ${brevoSender.email}:`, error);
    // Continue with other senders even if one fails
  }
}