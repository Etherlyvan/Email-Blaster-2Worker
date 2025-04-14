// app/api/groups/[id]/contacts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";

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
    const { contactId } = await request.json();
    
    // Check if group exists and belongs to user
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
    
    // Check if contact exists and belongs to user
    const contact = await prisma.contact.findUnique({
      where: {
        id: contactId,
        userId: session.user.id,
      },
    });
    
    if (!contact) {
      return new NextResponse(JSON.stringify({ error: "Contact not found" }), {
        status: 404,
      });
    }
    
    // Check if contact is already in group
    const existingGroupContact = await prisma.groupContact.findFirst({
      where: {
        contactId,
        contactGroupId: id,
      },
    });
    
    if (existingGroupContact) {
      return new NextResponse(JSON.stringify({ error: "Contact is already in this group" }), {
        status: 400,
      });
    }
    
    // Add contact to group
    const groupContact = await prisma.groupContact.create({
      data: {
        contactId,
        contactGroupId: id,
      },
    });
    
    return NextResponse.json(groupContact);
  } catch (error) {
    console.error("Error adding contact to group:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to add contact to group" }), {
      status: 500,
    });
  }
}