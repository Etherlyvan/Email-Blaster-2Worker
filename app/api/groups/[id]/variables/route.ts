// app/api/groups/[id]/variables/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Define a type for the additional data to avoid using 'any'
type AdditionalData = Record<string, string | number | boolean | null>;

// Updated for Next.js 15 with proper params typing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params promise to get the actual id
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    // Check if group exists and belongs to the user
    const group = await prisma.contactGroup.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!group) {
      return new NextResponse(JSON.stringify({ error: "Group not found" }), {
        status: 404,
      });
    }
    
    // Get a sample contact from the group
    const sampleContact = await prisma.contact.findFirst({
      where: {
        userId: session.user.id,
        groupContacts: {
          some: {
            contactGroupId: id,
          },
        },
      },
    });
    
    // Extract variables from all contacts in the group
    const contacts = await prisma.contact.findMany({
      where: {
        userId: session.user.id,
        groupContacts: {
          some: {
            contactGroupId: id,
          },
        },
      },
      select: {
        additionalData: true,
      },
    });
    
    // Collect all possible variable names from additionalData
    const variables = new Set<string>();
    variables.add("email"); // Always include email
    
    contacts.forEach(contact => {
      if (contact.additionalData) {
        // Fixed: Use proper type instead of 'any'
        Object.keys(contact.additionalData as AdditionalData).forEach(key => {
          variables.add(key);
        });
      }
    });
    
    // Create sample data from the first contact
    const sampleData: Record<string, string> = {
      // Fixed: Use nullish coalescing operator instead of logical OR
      email: sampleContact?.email ?? "example@example.com",
    };
    
    if (sampleContact?.additionalData) {
      // Fixed: Use proper type instead of 'any'
      Object.entries(sampleContact.additionalData as AdditionalData).forEach(([key, value]) => {
        sampleData[key] = String(value);
      });
    }
    
    return NextResponse.json({
      variables: Array.from(variables),
      sampleData,
    });
  } catch (error) {
    console.error("Error fetching group variables:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch group variables" }), {
      status: 500,
    });
  }
}