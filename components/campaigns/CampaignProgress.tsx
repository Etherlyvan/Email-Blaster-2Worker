// components/campaigns/CampaignProgress.tsx
"use client";

import { useState, useEffect } from "react";

interface CampaignProgressProps {
  readonly campaignId: string;
}

export function CampaignProgress({ campaignId }: CampaignProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Just a simple progress simulation for now
    const timer = setTimeout(() => {
      setProgress(50);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [campaignId]);
  
  if (isLoading) {
    return <div className="h-4 bg-gray-200 rounded-full animate-pulse"></div>;
  }
  
  return (
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-600"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
}