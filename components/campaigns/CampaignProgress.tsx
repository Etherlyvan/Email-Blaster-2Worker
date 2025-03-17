// components/campaigns/CampaignProgress.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface ProgressData {
  progress: number;
  totalCount: number;
  statusCounts: {
    PENDING?: number;
    SENT?: number;
    DELIVERED?: number;
    OPENED?: number;
    CLICKED?: number;
    BOUNCED?: number;
    FAILED?: number;
  };
}

export function CampaignProgress({ campaignId }: { campaignId: string }) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await axios.get<ProgressData>(`/api/campaigns/${campaignId}/progress`);
        setProgress(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching campaign progress:", err);
        setError("Failed to load progress data");
        setLoading(false);
      }
    };
    
    fetchProgress();
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchProgress, 3000);
    
    return () => clearInterval(interval);
  }, [campaignId]);
  
  if (loading) {
    return <div className="text-center py-4">Loading progress...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  if (!progress) {
    return <div>No progress data available</div>;
  }
  
  return (
    <div className="space-y-2">
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
          style={{ width: `${progress.progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-sm text-gray-500">
        <span>{progress.progress}% Complete</span>
        <span>
          {progress.statusCounts.SENT || 0} / {progress.totalCount} emails sent
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="text-center p-2 bg-green-50 rounded-md">
          <div className="text-green-700 font-medium">{progress.statusCounts.SENT || 0}</div>
          <div className="text-xs text-green-600">Sent</div>
        </div>
        
        <div className="text-center p-2 bg-yellow-50 rounded-md">
          <div className="text-yellow-700 font-medium">{progress.statusCounts.PENDING || 0}</div>
          <div className="text-xs text-yellow-600">Pending</div>
        </div>
        
        <div className="text-center p-2 bg-red-50 rounded-md">
          <div className="text-red-700 font-medium">{progress.statusCounts.FAILED || 0}</div>
          <div className="text-xs text-red-600">Failed</div>
        </div>
      </div>
    </div>
  );
}