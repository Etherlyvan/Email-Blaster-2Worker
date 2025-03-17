// app/auth/error/page.tsx
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

function AuthErrorContent() {
  // Using URL params instead of useSearchParams to avoid the suspense requirement
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const error = params.get("error");
  
  let errorMessage = "An authentication error occurred";
  
  if (error === "Configuration") {
    errorMessage = "There is a problem with the server configuration";
  } else if (error === "AccessDenied") {
    errorMessage = "You do not have access to this resource";
  } else if (error === "Verification") {
    errorMessage = "The verification link may have expired or is invalid";
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h1>
        <p className="mb-6 text-gray-700">{errorMessage}</p>
        <div className="text-center">
          <Link href="/dashboard">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}