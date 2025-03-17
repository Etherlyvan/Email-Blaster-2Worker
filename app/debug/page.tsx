// app/debug/page.tsx
"use client";

import { useSession } from "next-auth/react";

export default function DebugPage() {
  const { data: session, status } = useSession();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Session Status: {status}</h2>
        
        {status === "loading" && <p>Loading session...</p>}
        
        {status === "unauthenticated" && (
          <p className="text-red-600">You are not authenticated</p>
        )}
        
        {status === "authenticated" && session && (
          <div>
            <p className="text-green-600 mb-4">You are authenticated!</p>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}