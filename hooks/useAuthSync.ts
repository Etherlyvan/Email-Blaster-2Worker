// hooks/useAuthSync.ts
"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function useAuthSync() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      // Sync user with database
      fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }),
      }).catch(console.error);
    }
  }, [session, status]);
  
  return { session, status };
}