// app/api/contacts/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { authOptions } from "../../../../lib/auth";

const importSchema = z.object({
  contacts: z.array(
    z.object({
      email: z.string().email(),
      additionalData: z.record(z.any()).optional(),
    })
  ),
  groupIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const json = await request.json();
    const validatedData = importSchema.parse(json);
    
    if (validatedData.contacts.length === 0) {
      return new NextResponse(JSON.stringify({ error: "No contacts provided" }), {
        status: 400,
      });
    }
    
    if (validatedData.groupIds.length === 0) {
      return new NextResponse(JSON.stringify({ error: "No groups selected" }), {
        status: 400,
      });
    }
    
    // Get existing contacts to avoid duplicates
    const existingContacts = await prisma.contact.findMany({
      where: {
        userId: session.user.id,
        email: {
          in: validatedData.contacts.map(c => c.email),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });
    
    const existingEmails = new Set(existingContacts.map(c => c.email));
    
    // Filter out contacts that already exist
    const newContacts = validatedData.contacts.filter(c => !existingEmails.has(c.email));
    
    // Create new contacts
    const createdContacts = await prisma.$transaction(
      newContacts.map(contact => 
        prisma.contact.create({
          data: {
            email: contact.email,
            additionalData: contact.additionalData || {},
            userId: session.user.id,
          },
        })
      )
    );
    
    // Combine existing and newly created contacts
    const allContacts = [
      ...existingContacts,
      ...createdContacts,
    ];
    
    // Create group connections for all contacts
    const groupConnections = [];
    for (const contact of allContacts) {
      for (const groupId of validatedData.groupIds) {
        groupConnections.push({
          contactId: contact.id,
          contactGroupId: groupId,
        });
      }
    }
    
    // Check for existing group connections to avoid duplicates
    const existingConnections = await prisma.groupContact.findMany({
      where: {
        contactId: { in: allContacts.map(c => c.id) },
        contactGroupId: { in: validatedData.groupIds },
      },
      select: {
        contactId: true,
        contactGroupId: true,
      },
    });
    
    const existingConnectionsSet = new Set(
      existingConnections.map(c => `${c.contactId}-${c.contactGroupId}`)
    );
    
    // Filter out connections that already exist
    const newConnections = groupConnections.filter(
      c => !existingConnectionsSet.has(`${c.contactId}-${c.contactGroupId}`)
    );
    
    // Create new group connections
    if (newConnections.length > 0) {
      await prisma.groupContact.createMany({
        data: newConnections,
        skipDuplicates: true,
      });
    }
    
    return NextResponse.json({
      success: true,
      imported: createdContacts.length,
      existing: existingContacts.length,
      total: allContacts.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors }), {
        status: 400,
      });
    }
    
    console.error("Error importing contacts:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to import contacts" }), {
      status: 500,
    });
  }
}