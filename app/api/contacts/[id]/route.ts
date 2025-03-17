// app/api/contacts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

// Fix the params type to include Promise as you've shown
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