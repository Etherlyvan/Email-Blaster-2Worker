// app/api/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { authOptions } from "../../../lib/auth";

const groupSchema = z.object({
  name: z.string().min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const groups = await prisma.contactGroup.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { groupContacts: true },
        },
      },
      orderBy: { name: "asc" },
    });
    
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch groups" }), {
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
    const validatedData = groupSchema.parse(json);
    
    const group = await prisma.contactGroup.create({
      data: {
        name: validatedData.name,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors }), {
        status: 400,
      });
    }
    
    console.error("Error creating group:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to create group" }), {
      status: 500,
    });
  }
}