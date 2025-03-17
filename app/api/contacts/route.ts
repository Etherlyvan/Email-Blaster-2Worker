// app/api/contacts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { authOptions } from "../../../lib/auth";

const contactSchema = z.object({
  email: z.string().email(),
  additionalData: z.record(z.any()).optional(),
  groupIds: z.array(z.string()).optional(),
});


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const notInGroupId = searchParams.get("notInGroup");
    
    // Define a proper type for the where clause instead of using 'any'
    const whereClause: {
      userId: string;
      groupContacts?: {
        some?: { contactGroupId: string };
        none?: { contactGroupId: string };
      };
    } = {
      userId: session.user.id,
    };
    
    if (groupId) {
      whereClause.groupContacts = {
        some: {
          contactGroupId: groupId,
        },
      };
    }
    
    if (notInGroupId) {
      // If groupId was set, we need to keep the 'some' property
      if (groupId) {
        whereClause.groupContacts = {
          ...whereClause.groupContacts,
          none: {
            contactGroupId: notInGroupId,
          },
        };
      } else {
        whereClause.groupContacts = {
          none: {
            contactGroupId: notInGroupId,
          },
        };
      }
    }
    
    const contacts = await prisma.contact.findMany({
      where: whereClause,
      include: {
        groupContacts: {
          include: {
            contactGroup: true,
          },
        },
      },
      orderBy: { email: "asc" },
    });
    
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch contacts" }), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const json = await request.json();
    const validatedData = contactSchema.parse(json);
    
    // Check if contact with this email already exists for this user
    const existingContact = await prisma.contact.findFirst({
      where: {
        email: validatedData.email,
        userId: session.user.id,
      },
    });
    
    if (existingContact) {
      return new NextResponse(JSON.stringify({ error: "Contact with this email already exists" }), {
        status: 400,
      });
    }
    
    // Create the contact
    const contact = await prisma.contact.create({
      data: {
        email: validatedData.email,
        additionalData: validatedData.additionalData || {},
        userId: session.user.id,
      },
    });
    
    // Add to groups if specified
    if (validatedData.groupIds && validatedData.groupIds.length > 0) {
      const groupConnections = validatedData.groupIds.map((groupId) => ({
        contactGroupId: groupId,
        contactId: contact.id,
      }));
      
      await prisma.groupContact.createMany({
        data: groupConnections,
      });
    }
    
    return NextResponse.json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors }), {
        status: 400,
      });
    }
    
    console.error("Error creating contact:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to create contact" }), {
      status: 500,
    });
  }
}