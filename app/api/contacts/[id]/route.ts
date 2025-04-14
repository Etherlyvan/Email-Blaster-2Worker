// app/api/contacts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    
    try {
      const contact = await prisma.contact.findUnique({
        where: {
          id,
          userId: session.user.id,
        },
        include: {
          groupContacts: {
            include: {
              contactGroup: true,
            },
          },
        },
      });
      
      if (!contact) {
        return new NextResponse(JSON.stringify({ error: "Contact not found" }), {
          status: 404,
        });
      }
      
      return NextResponse.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      return new NextResponse(JSON.stringify({ error: "Failed to fetch contact" }), {
        status: 500,
      });
    }
  }
  
  export async function PUT(
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
      const { email, additionalData, groupIds } = data;
      
      // Validate input
      const contactSchema = z.object({
        email: z.string().email("Valid email is required"),
        additionalData: z.record(z.any()).optional(),
        groupIds: z.array(z.string()).optional(),
      });
      
      contactSchema.parse({ email, additionalData, groupIds });
      
      // Check if contact exists and belongs to user
      const existingContact = await prisma.contact.findUnique({
        where: {
          id,
          userId: session.user.id,
        },
      });
      
      if (!existingContact) {
        return new NextResponse(JSON.stringify({ error: "Contact not found" }), {
          status: 404,
        });
      }
      
      // Check if email is already used by another contact
      if (email !== existingContact.email) {
        const emailExists = await prisma.contact.findFirst({
          where: {
            email,
            userId: session.user.id,
            id: { not: id },
          },
        });
        
        if (emailExists) {
          return new NextResponse(JSON.stringify({ error: "Email is already in use" }), {
            status: 400,
          });
        }
      }
      
      // Update the contact
      const updatedContact = await prisma.contact.update({
        where: { id },
        data: {
          email,
          additionalData,
        },
      });
      
      // Update group memberships if provided
      if (groupIds) {
        // First delete all existing group contacts
        await prisma.groupContact.deleteMany({
          where: {
            contactId: id,
          },
        });
        
        // Then create new group contacts
        if (groupIds.length > 0) {
          await prisma.groupContact.createMany({
            data: groupIds.map((groupId: string) => ({
              contactId: id,
              contactGroupId: groupId,
            })),
            skipDuplicates: true,
          });
        }
      }
      
      return NextResponse.json(updatedContact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new NextResponse(JSON.stringify({ error: error.errors }), {
          status: 400,
        });
      }
      
      console.error("Error updating contact:", error);
      return new NextResponse(JSON.stringify({ error: "Failed to update contact" }), {
        status: 500,
      });
    }
  }
  
  export async function DELETE(
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
      // Check if contact exists and belongs to user
      const contact = await prisma.contact.findUnique({
        where: {
          id,
          userId: session.user.id,
        },
      });
      
      if (!contact) {
        return new NextResponse(JSON.stringify({ error: "Contact not found" }), {
          status: 404,
        });
      }
      
      // Delete related group contacts first
      await prisma.groupContact.deleteMany({
        where: {
          contactId: id,
        },
      });
      
      // Delete the contact
      await prisma.contact.delete({
        where: { id },
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact:", error);
      return new NextResponse(JSON.stringify({ error: "Failed to delete contact" }), {
        status: 500,
      });
    }
  }