// app/api/groups/[id]/contacts/[contactId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
    const { id, contactId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
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
    
    // Remove contact from group
    await prisma.groupContact.deleteMany({
      where: {
        contactId,
        contactGroupId: id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing contact from group:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to remove contact from group" }), {
      status: 500,
    });
  }
}