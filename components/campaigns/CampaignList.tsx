// components/campaigns/CampaignList.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Campaign } from "../../types/campaign";
import { format, formatDistanceToNow } from 'date-fns';
import { 
  PaperAirplaneIcon, 
  TrashIcon, 
  EyeIcon, 
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  EnvelopeIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import { Button } from "../ui/Button";

// Enhanced with stats
interface CampaignWithStats extends Campaign {
  stats?: Record<string, number>;
  _count?: {
    EmailDelivery: number;
  };
}

interface CampaignListProps {
  readonly campaigns: CampaignWithStats[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<Record<string, number>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  useEffect(() => {
    const sendingCampaigns = campaigns.filter(c => c.status === 'SENDING');
    if (sendingCampaigns.length === 0) return;
    
    const fetchProgress = async () => {
      for (const campaign of sendingCampaigns) {
        try {
          const response = await axios.get(`/api/campaigns/${campaign.id}/progress`);
          setProgressData(prev => ({
            ...prev,
            [campaign.id]: response.data.progress
          }));
        } catch (error) {
          console.error(`Error fetching progress for campaign ${campaign.id}:`, error);
        }
      }
    };
    
    fetchProgress();
    const interval = setInterval(fetchProgress, 5000);
    
    return () => clearInterval(interval);
  }, [campaigns]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, statusFilter]);
  
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
  
  // Get status color and badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800';
      case 'SENDING':
        return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED':
        return 'bg-amber-100 text-amber-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM d, yyyy h:mm a');
  };
  
  // Calculate stats for a campaign
  const getCampaignStats = (campaign: CampaignWithStats) => {
    const totalSent = campaign.stats?.SENT || 0;
    const totalOpened = campaign.stats?.OPENED || 0;
    const totalClicked = campaign.stats?.CLICKED || 0;
    const totalCount = campaign._count?.EmailDelivery || 0;
    
    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
    
    return { totalSent, totalOpened, totalClicked, openRate, clickRate, totalCount };
  };
  
  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns
    .filter(campaign => 
      campaign.name.toLowerCase().includes(filter.toLowerCase()) || 
      campaign.subject.toLowerCase().includes(filter.toLowerCase())
    )
    .filter(campaign => 
      statusFilter ? campaign.status === statusFilter : true
    );
  
  // Calculate pagination
  const totalItems = filteredCampaigns.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Ensure current page is within bounds
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  if (safeCurrentPage !== currentPage) {
    setCurrentPage(safeCurrentPage);
  }
  
  // Get current page of data
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + pageSize);
  
  // Navigation functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);
  
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are fewer than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page, last page, current page, and pages around current page
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust start and end to always show 3 pages
      if (startPage === 2) endPage = Math.min(totalPages - 1, 4);
      if (endPage === totalPages - 1) startPage = Math.max(2, totalPages - 3);
      
      // Add ellipsis if needed
      if (startPage > 2) pageNumbers.push(-1); // -1 represents ellipsis
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) pageNumbers.push(-2); // -2 represents ellipsis
      
      // Add last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  if (campaigns.length === 0) {
    return (
      <div className="py-12 px-4 text-center">
        <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No campaigns yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first email campaign.
        </p>
        <div className="mt-6">
          <Link href="/campaigns/create">
            <Button variant="primary">
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden">
      <div className="bg-white pt-6 px-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search campaigns..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setFilter("")}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
      </div>
      
      <div className="shadow-sm">
        <div className="min-w-full divide-y divide-gray-200">
          {paginatedCampaigns.length > 0 ? (
            <div className="bg-white">
              {paginatedCampaigns.map((campaign) => {
                const { openRate, clickRate, totalSent, totalCount } = getCampaignStats(campaign);
                return (
                  <div 
                    key={campaign.id} 
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-medium text-gray-900 truncate group">
                            <Link href={`/campaigns/${campaign.id}`} className="hover:text-blue-600 focus:outline-none">
                              {campaign.name}
                            </Link>
                          </h2>
                          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(campaign.status)}`}>
                                {campaign.status === 'DRAFT' ? 'Draft' : 
                                 campaign.status === 'SENDING' ? 'Sending' : 
                                 campaign.status === 'SCHEDULED' ? 'Scheduled' : 
                                 campaign.status === 'SENT' ? 'Sent' : 'Failed'}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <span>{campaign.subject}</span>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <UserGroupIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <span>{campaign.group?.name || "Unknown group"}</span>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <span>
                                {campaign.status === 'SCHEDULED' && campaign.schedule
                                  ? `Scheduled for ${formatDate(campaign.schedule)}`
                                  : `Created ${formatDistanceToNow(new Date(campaign.createdAt))} ago`}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                          {campaign.status === 'SENT' && (
                            <div className="flex flex-col text-center px-3 py-1 bg-gray-50 rounded-md">
                              <div className="flex justify-center space-x-3">
                                <div>
                                  <span className="text-xs text-gray-500">Sent</span>
                                  <p className="text-sm font-medium">{totalSent}/{totalCount}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Opens</span>
                                  <p className="text-sm font-medium">{openRate}%</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Clicks</span>
                                  <p className="text-sm font-medium">{clickRate}%</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {campaign.status === 'SENDING' && (
                            <div className="w-full sm:w-32">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-in-out" 
                                  style={{ width: `${progressData[campaign.id] || 0}%` }}
                                ></div>
                              </div>
                              <p className="mt-1 text-xs text-gray-500 text-center">
                                {progressData[campaign.id] ? `${progressData[campaign.id]}% complete` : 'Processing...'}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex space-x-2 justify-center sm:justify-end">
                            <Link href={`/campaigns/${campaign.id}`}>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                icon={<EyeIcon className="h-4 w-4" />}
                              >
                                View
                              </Button>
                            </Link>
                            
                            {campaign.status === 'SENT' && (
                              <Link href={`/campaigns/${campaign.id}/analytics`}>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  icon={<ChartBarIcon className="h-4 w-4" />}
                                >
                                  Analytics
                                </Button>
                              </Link>
                            )}
                            
                            {campaign.status === 'DRAFT' && (
                              <Button 
                                variant="primary" 
                                size="sm"
                                icon={<PaperAirplaneIcon className="h-4 w-4" />}
                                onClick={() => handleSendNow(campaign.id)}
                                loading={isSending === campaign.id}
                              >
                                Send
                              </Button>
                            )}
                            
                            {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                              <Button 
                                variant="danger" 
                                size="sm"
                                icon={<TrashIcon className="h-4 w-4" />}
                                onClick={() => handleDelete(campaign.id)}
                                loading={isDeleting === campaign.id}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter to find what you&apos;re looking for.
              </p>
              <div className="mt-6">
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    setFilter("");
                    setStatusFilter(null);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Pagination Controls */}
      {filteredCampaigns.length > 0 && (
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0 text-sm text-gray-500">
              Showing {Math.min(totalItems, startIndex + 1)}-{Math.min(totalItems, startIndex + pageSize)} of {totalItems} campaigns
              {(filter || statusFilter) && " with the current filters"}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Items per page:</span>
                <select
                  className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 p-1"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                >
                  {[5, 10, 20, 50].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    aria-label="Go to first page"
                  >
                    <span className="sr-only">First</span>
                    <ChevronDoubleLeftIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    aria-label="Go to previous page"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  
                  {getPageNumbers().map((pageNumber, index) => (
                    pageNumber < 0 ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${pageNumber}`}
                        onClick={() => setCurrentPage(pageNumber)}
                        aria-current={currentPage === pageNumber ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  ))}
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    aria-label="Go to next page"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    aria-label="Go to last page"
                  >
                    <span className="sr-only">Last</span>
                    <ChevronDoubleRightIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}