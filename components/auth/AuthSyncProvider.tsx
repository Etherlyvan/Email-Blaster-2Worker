// components/auth/AuthSyncProvider.tsx
"use client";

import { createContext, useContext } from "react";
import { useAuthSync } from "@/hooks/useAuthSync";

const AuthSyncContext = createContext<ReturnType<typeof useAuthSync> | null>(null);

export function useAuthSyncContext() {
  const context = useContext(AuthSyncContext);
  if (!context) {
    throw new Error("useAuthSyncContext must be used within an AuthSyncProvider");
  }
  return context;
}

interface AuthSyncProviderProps {
  readonly children: React.ReactNode;
}

export function AuthSyncProvider({ children }: AuthSyncProviderProps) {
  const authSync = useAuthSync();
  
  return (
    <AuthSyncContext.Provider value={authSync}>
      {children}
    </AuthSyncContext.Provider>
  );
}