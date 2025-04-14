// app/api/debug/route.ts
import { NextResponse } from "next/server";

// Remove the unused request parameter
export async function GET() {
  return NextResponse.json({
    message: "Debug endpoint is working",
    timestamp: new Date().toISOString(),
    routes: [
      "/api/groups",
      "/api/groups/[id]",
      "/api/groups/[id]/contacts",
      "/api/groups/[id]/contacts/[contactId]",
      "/api/contacts",
      "/api/contacts/[id]",
    ]
  });
}