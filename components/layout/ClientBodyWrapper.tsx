// components/layout/ClientBodyWrapper.tsx
"use client";

import { useEffect, useState } from "react";

interface ClientBodyWrapperProps {
  readonly children: React.ReactNode;
}

export default function ClientBodyWrapper({ children }: ClientBodyWrapperProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration issues by only rendering content after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <body className={mounted ? "bg-gray-50" : "bg-gray-50 opacity-0"}>
      {children}
    </body>
  );
}