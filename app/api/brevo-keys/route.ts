// app/api/brevo-keys/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { authOptions } from "../../../lib/auth";

const brevoKeySchema = z.object({
  name: z.string().min(1),
  apiKey: z.string().min(1),
  smtpUsername: z.string().min(1),
  smtpPassword: z.string().min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const brevoKeys = await prisma.brevoKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(brevoKeys);
  } catch (error) {
    console.error("Error fetching Brevo keys:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch Brevo keys" }), {
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
    const validatedData = brevoKeySchema.parse(json);
    
    const brevoKey = await prisma.brevoKey.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json(brevoKey);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors }), {
        status: 400,
      });
    }
    
    console.error("Error creating Brevo key:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to create Brevo key" }), {
      status: 500,
    });
  }
}