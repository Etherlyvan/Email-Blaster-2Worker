// components/campaigns/CampaignDetailStats.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { 
  EnvelopeIcon, 
  EnvelopeOpenIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface CampaignDetailStatsProps {
  readonly campaignId: string; // We'll keep this for future use, but won't use it now
  readonly stats: Record<string, number>;
  readonly totalCount: number;
}

export function CampaignDetailStats({ stats, totalCount }: CampaignDetailStatsProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Fix SonarLint S6479 by using unique keys instead of array indices */}
        <div key="skeleton-delivered" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div key="skeleton-opened" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div key="skeleton-clicked" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div key="skeleton-failed" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }
  
  // Calculate metrics
  const sent = stats.SENT || 0;
  const delivered = stats.DELIVERED || 0;
  const opened = stats.OPENED || 0;
  const clicked = stats.CLICKED || 0;
  const bounced = stats.BOUNCED || 0;
  const failed = stats.FAILED || 0;
  
  const deliveredTotal = sent + delivered + opened + clicked;
  const openRate = deliveredTotal > 0 ? Math.round((opened + clicked) / deliveredTotal * 100) : 0;
  const clickRate = deliveredTotal > 0 ? Math.round(clicked / deliveredTotal * 100) : 0;
  const bounceRate = totalCount > 0 ? Math.round(bounced / totalCount * 100) : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <div className="p-5 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-3">
            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{deliveredTotal}</h3>
          <p className="text-sm text-gray-500">Delivered</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ width: `${totalCount > 0 ? (deliveredTotal / totalCount) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {totalCount > 0 ? Math.round((deliveredTotal / totalCount) * 100) : 0}% of total
          </p>
        </div>
      </Card>
      
      <Card>
        <div className="p-5 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-3">
            <EnvelopeOpenIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{opened + clicked}</h3>
          <p className="text-sm text-gray-500">Opened</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-600 h-1.5 rounded-full" 
              style={{ width: `${openRate}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {openRate}% open rate
          </p>
        </div>
      </Card>
      
      <Card>
        <div className="p-5 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-3">
            {/* Replace CursorClickIcon with an inline SVG */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="h-6 w-6 text-indigo-600"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{clicked}</h3>
          <p className="text-sm text-gray-500">Clicked</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full" 
              style={{ width: `${clickRate}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {clickRate}% click rate
          </p>
        </div>
      </Card>
      
      <Card>
        <div className="p-5 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full mb-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{bounced + failed}</h3>
          <p className="text-sm text-gray-500">Bounced/Failed</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-red-600 h-1.5 rounded-full" 
              style={{ width: `${bounceRate}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {bounceRate}% bounce rate
          </p>
        </div>
      </Card>
    </div>
  );
}