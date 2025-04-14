// app/api/templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { authOptions } from "../../../../lib/auth";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  content: z.string(),
  htmlContent: z.string(),
});

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
    const template = await prisma.emailTemplate.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!template) {
      return new NextResponse(JSON.stringify({ error: "Template not found" }), {
        status: 404,
      });
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch template" }), {
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
    const json = await request.json();
    const validatedData = templateSchema.parse(json);
    
    // Make sure both content and htmlContent are the same
    const template = await prisma.emailTemplate.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        name: validatedData.name,
        description: validatedData.description ?? '',
        content: validatedData.htmlContent, // Use htmlContent for both fields
        htmlContent: validatedData.htmlContent,
      },
    });
    
    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors }), {
        status: 400,
      });
    }
    
    console.error("Error updating template:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to update template" }), {
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
    await prisma.emailTemplate.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to delete template" }), {
      status: 500,
    });
  }
}