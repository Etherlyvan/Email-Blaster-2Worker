// components/auth/AuthProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthSyncProvider } from "./AuthSyncProvider";

interface AuthProviderProps {
  readonly children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthSyncProvider>{children}</AuthSyncProvider>
    </SessionProvider>
  );
}