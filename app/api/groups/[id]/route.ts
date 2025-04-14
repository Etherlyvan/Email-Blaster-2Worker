// app/api/groups/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export async function GET(
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
    const group = await prisma.contactGroup.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        groupContacts: {
          include: {
            contact: true,
          },
        },
      },
    });
    
    if (!group) {
      return new NextResponse(JSON.stringify({ error: "Group not found" }), {
        status: 404,
      });
    }
    
    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch group" }), {
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
    
    const group = await prisma.contactGroup.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        name: data.name,
      },
    });
    
    return NextResponse.json(group);
  } catch (error) {
    console.error("Error updating group:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to update group" }), {
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
    console.log("Deleting group with ID:", id);
    
    // First delete all group contacts to avoid foreign key constraints
    await prisma.groupContact.deleteMany({
      where: {
        contactGroupId: id,
      },
    });
    
    // Then delete the group
    await prisma.contactGroup.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to delete group" }), {
      status: 500,
    });
  }
}