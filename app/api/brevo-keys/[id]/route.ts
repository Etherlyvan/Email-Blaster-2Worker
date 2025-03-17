// app/api/brevo-keys/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

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
    await prisma.brevoKey.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Brevo key:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to delete Brevo key" }), {
      status: 500,
    });
  }
}

export async function PATCH(
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
    
    const brevoKey = await prisma.brevoKey.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        isActive: data.isActive,
      },
    });
    
    return NextResponse.json(brevoKey);
  } catch (error) {
    console.error("Error updating Brevo key:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to update Brevo key" }), {
      status: 500,
    });
  }
}