// components/campaigns/CampaignList.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Campaign } from "../../types/campaign";

// Define a type for the progress data
interface ProgressData {
  progress: number;
  totalCount: number;
  statusCounts: {
    PENDING: number;
    SENT: number;
    FAILED: number;
  };
}

// Helper function for consistent date formatting
const formatDate = (dateString: string | Date | undefined | null) => {
  if (!dateString) return 'Not scheduled';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Use a fixed format that doesn't depend on locale
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// Client-side button components
function DeleteCampaignButton({ campaignId, isDeleting, onDelete }: { 
  campaignId: string; 
  isDeleting: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      onClick={() => {
        if (confirm('Are you sure you want to delete this campaign?')) {
          onDelete(campaignId);
        }
      }}
      disabled={isDeleting}
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}

function SendCampaignButton({ campaignId, isSending, onSend }: {
  campaignId: string;
  isSending: boolean;
  onSend: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      onClick={() => {
        if (confirm('Are you sure you want to send this campaign now?')) {
          onSend(campaignId);
        }
      }}
      disabled={isSending}
    >
      {isSending ? "Sending..." : "Send Now"}
    </button>
  );
}

function ViewCampaignButton({ campaignId }: { campaignId: string }) {
  return (
    <Link href={`/campaigns/${campaignId}`}>
      <button
        type="button"
        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        View
      </button>
    </Link>
  );
}

interface CampaignListProps {
  readonly campaigns: Campaign[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<Record<string, ProgressData>>({});
  
  const filteredCampaigns = campaigns
    .filter(campaign => 
      campaign.name.toLowerCase().includes(filter.toLowerCase()) || 
      campaign.subject.toLowerCase().includes(filter.toLowerCase())
    )
    .filter(campaign => 
      statusFilter ? campaign.status === statusFilter : true
    );
  
  // Fetch progress for all sending campaigns
  useEffect(() => {
    const sendingCampaigns = campaigns.filter(c => c.status === 'SENDING');
    if (sendingCampaigns.length === 0) return;
    
    const fetchProgress = async () => {
      const progressPromises = sendingCampaigns.map(campaign => 
        axios.get(`/api/campaigns/${campaign.id}/progress`)
          .then(response => ({ campaignId: campaign.id, data: response.data }))
          .catch(error => {
            console.error(`Error fetching progress for campaign ${campaign.id}:`, error);
            return null;
          })
      );
      
      const results = await Promise.all(progressPromises);
      const newProgressData = { ...progressData };
      
      results.forEach(result => {
        if (result) {
          newProgressData[result.campaignId] = result.data;
        }
      });
      
      setProgressData(newProgressData);
    };
    
    fetchProgress();
    const interval = setInterval(fetchProgress, 5000);
    
    return () => clearInterval(interval);
  }, [campaigns, progressData]); // Added progressData as a dependency
  
  const handleDelete = async (campaignId: string) => {
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
  
  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800';
      case 'SENDING':
        return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search campaigns..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setFilter("")}
            >
              &times;
            </button>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter ?? ""}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="SENDING">Sending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>
      
      {filteredCampaigns.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link href={`/campaigns/${campaign.id}`} className="text-blue-600 hover:text-blue-900">
                      {campaign.name}
                    </Link>
                    
                    {campaign.status === 'SENDING' && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ 
                              width: `${progressData[campaign.id]?.progress || 0}%`,
                              transition: 'width 0.5s ease-in-out'
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {progressData[campaign.id] 
                            ? `${progressData[campaign.id].progress}% complete (${progressData[campaign.id].statusCounts.SENT || 0}/${progressData[campaign.id].totalCount})`
                            : 'Processing...'}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(campaign.status)}`}>
                      {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.group?.name ?? `Group ID: ${campaign.groupId}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.schedule ? formatDate(campaign.schedule) : 'Not scheduled'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(campaign.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <ViewCampaignButton campaignId={campaign.id} />
                      
                      {campaign.status === 'DRAFT' && (
                        <SendCampaignButton 
                          campaignId={campaign.id}
                          isSending={isSending === campaign.id}
                          onSend={handleSendNow}
                        />
                      )}
                      
                      {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                        <DeleteCampaignButton 
                          campaignId={campaign.id}
                          isDeleting={isDeleting === campaign.id}
                          onDelete={handleDelete}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-md shadow">
          {filter || statusFilter ? (
            <p className="text-gray-500">No campaigns match your filters</p>
          ) : (
            <>
              <p className="text-gray-500">No campaigns available</p>
              <div className="mt-4">
                <Link href="/campaigns/create">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Create Campaign
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}