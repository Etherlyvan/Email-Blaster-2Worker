// app/api/auth/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  try {
    const data = await request.json();
    
    // Find or create user
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {
        name: data.name,
        image: data.image,
      },
      create: {
        email: session.user.email,
        name: data.name,
        image: data.image,
      },
    });
    
    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Error syncing user:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to sync user" }), {
      status: 500,
    });
  }
}