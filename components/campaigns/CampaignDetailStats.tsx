// components/campaigns/CampaignDetailStats.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { 
  EnvelopeOpenIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface CampaignDetailStatsProps {
  readonly campaignId: string;
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
        <div key="skeleton-sent" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div key="skeleton-opened" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div key="skeleton-clicked" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div key="skeleton-failed" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }
  
  // Get raw counts from the stats
  const sent = stats.SENT || 0;
  const delivered = stats.DELIVERED || 0;
  const opened = stats.OPENED || 0;
  const clicked = stats.CLICKED || 0;
  const bounced = stats.BOUNCED || 0;
  const failed = stats.FAILED || 0;
  
  // Calculate total delivered emails (all statuses that indicate successful delivery)
  const totalDelivered = sent + delivered + opened + clicked;
  
  // Calculate percentages based on total emails
  const deliveryRate = totalCount > 0 ? Math.round((totalDelivered / totalCount) * 100) : 0;
  const openRate = totalDelivered > 0 ? Math.round(((opened + clicked) / totalDelivered) * 100) : 0;
  const clickRate = totalDelivered > 0 ? Math.round((clicked / totalDelivered) * 100) : 0;
  const bounceRate = totalCount > 0 ? Math.round(((bounced + failed) / totalCount) * 100) : 0;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-5 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-3">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{totalDelivered}</h3>
            <p className="text-sm text-gray-500">Total Delivered</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${deliveryRate}%` }}
              ></div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {deliveryRate}% of total ({totalCount} emails)
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="p-5 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-3">
              <EnvelopeOpenIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{opened + clicked}</h3>
            <p className="text-sm text-gray-500">Total Opened</p>
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
            <p className="text-sm text-gray-500">Total Clicked</p>
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
      
      {/* Status breakdown section */}
      <Card>
        <div className="p-4">
          <div className="flex items-center mb-4">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Current Status Breakdown</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-gray-50 p-3 rounded-md text-center">
              <div className="text-sm font-semibold text-gray-700">{sent}</div>
              <div className="text-xs text-gray-500">Awaiting Open</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md text-center">
              <div className="text-sm font-semibold text-gray-700">{totalDelivered}</div>
              <div className="text-xs text-gray-500">Delivered</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md text-center">
              <div className="text-sm font-semibold text-green-700">{opened}</div>
              <div className="text-xs text-gray-500">Opened</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md text-center">
              <div className="text-sm font-semibold text-indigo-700">{clicked}</div>
              <div className="text-xs text-gray-500">Clicked</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md text-center">
              <div className="text-sm font-semibold text-red-700">{bounced}</div>
              <div className="text-xs text-gray-500">Bounced</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md text-center">
              <div className="text-sm font-semibold text-red-700">{failed}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>
          
          <div className="mt-4 bg-blue-50 rounded-md p-3 text-xs text-blue-700">
            <p>
              <strong>Note:</strong> The cards above show cumulative totals (all emails that reached each state), 
              while this breakdown shows the current status of each email. When an email is opened, its status 
              changes from &quot;Awaiting Open&quot; to &quot;Opened&quot;, and when clicked, from &quot;Opened&quot; to &quot;Clicked&quot;.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}