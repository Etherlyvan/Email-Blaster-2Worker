// components/campaigns/CampaignList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "../ui/Button";
import {  
  TrashIcon, 
  ChartBarIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

// Define proper types for campaign and stats
interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  schedule?: Date | null;
  createdAt: Date;
  group: {
    name: string;
  };
  brevoKey?: {
    name: string;
  } | null;
  _count?: {
    EmailDelivery: number;
  };
  stats?: Record<string, number>;
}

interface CampaignListProps {
  readonly campaigns: readonly Campaign[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);
  
  // Helper function to calculate campaign stats
  const calculateStats = (stats: Record<string, number> = {}, totalCount: number) => {
    // Get raw counts
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
    
    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced, 
      failed,
      totalDelivered,
      deliveryRate,
      openRate,
      clickRate
    };
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date(date));
  };
  
  const handleDelete = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return;
    }
    
    setIsDeleting(campaignId);
    
    try {
      await axios.delete(`/api/campaigns/${campaignId}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      alert("Failed to delete campaign. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };
  
  const handleSendNow = async (campaignId: string) => {
    if (!confirm("Are you sure you want to send this campaign now?")) {
      return;
    }
    
    setIsSending(campaignId);
    
    try {
      await axios.post(`/api/campaigns/${campaignId}/send`);
      router.refresh();
    } catch (error) {
      console.error("Failed to send campaign:", error);
      alert("Failed to send campaign. Please try again.");
    } finally {
      setIsSending(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Sent
          </span>
        );
      case 'SENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <PaperAirplaneIcon className="h-4 w-4 mr-1" />
            Sending
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <CalendarIcon className="h-4 w-4 mr-1" />
            Scheduled
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Draft
          </span>
        );
    }
  };
  
  if (campaigns.length === 0) {
    return (
      <div className="p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
        <div className="mt-6">
          <Link href="/campaigns/create">
            <Button variant="primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Create New Campaign
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Campaign
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Group
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stats
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {campaigns.map((campaign) => {
            // Calculate stats for this campaign
            const { totalDelivered, openRate, clickRate } = calculateStats(
              campaign.stats || {}, 
              campaign._count?.EmailDelivery || 0
            );
            
            return (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <PaperAirplaneIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                          {campaign.name}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500">{campaign.subject}</div>
                      <div className="text-xs text-gray-400">
                        Created: {formatDate(campaign.createdAt)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{campaign.group.name}</div>
                  <div className="text-xs text-gray-500">
                    {campaign.brevoKey ? campaign.brevoKey.name : "No Brevo Key"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    {getStatusBadge(campaign.status)}
                  </div>
                  {campaign.schedule && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {formatDate(campaign.schedule as Date)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {campaign.status === 'SENT' || campaign.status === 'SENDING' ? (
                    <div className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Delivered:</span>
                        <span className="font-medium">
                          {totalDelivered} / {campaign._count?.EmailDelivery || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Open rate:</span>
                        <span className="font-medium">{openRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Click rate:</span>
                        <span className="font-medium">{clickRate}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      {campaign.status === 'SCHEDULED' ? 'Will be sent at scheduled time' : 'Not sent yet'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button variant="outline-primary" size="sm">
                        View
                      </Button>
                    </Link>
                    
                    {campaign.status === 'SENT' && (
                      <Link href={`/campaigns/${campaign.id}/analytics`}>
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          icon={<ChartBarIcon className="h-4 w-4 mr-1" />}
                        >
                          Analytics
                        </Button>
                      </Link>
                    )}
                    
                    {campaign.status === 'DRAFT' && (
                      <>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          icon={<PaperAirplaneIcon className="h-4 w-4 mr-1" />}
                          onClick={() => handleSendNow(campaign.id)}
                          loading={isSending === campaign.id}
                        >
                          Send
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          icon={<TrashIcon className="h-4 w-4 mr-1" />}
                          onClick={() => handleDelete(campaign.id)}
                          loading={isDeleting === campaign.id}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                    
                    {campaign.status === 'SCHEDULED' && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        icon={<TrashIcon className="h-4 w-4 mr-1" />}
                        onClick={() => handleDelete(campaign.id)}
                        loading={isDeleting === campaign.id}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}