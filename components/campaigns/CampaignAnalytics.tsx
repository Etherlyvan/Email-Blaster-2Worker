// components/campaigns/CampaignAnalytics.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { 
  ChartBarIcon, 
  ClockIcon, 
  EnvelopeIcon, 
  EnvelopeOpenIcon, 
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

// Define a type alias for the status
type EmailStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED';

// Define a type alias for date values
type DateValue = Date | string | null;



// Create a type that can adapt Prisma data to our EmailDelivery interface
// This helps bridge the gap between Prisma's types and our component's types
type EmailDeliveryAdapter<T> = {
  id: string;
  status: EmailStatus;
  sentAt: DateValue;
  openedAt: DateValue;
  clickedAt: DateValue;
  errorMessage: string | null;
  contact: {
    id: string;
    email: string;
    additionalData?: T;
  };
};

interface CampaignAnalyticsProps {
  readonly deliveries: readonly EmailDeliveryAdapter<unknown>[];
}

export function CampaignAnalytics({ deliveries }: CampaignAnalyticsProps) {
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);
  
  if (!mounted) {
    return (
      <Card>
        <div className="p-6">
          <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </Card>
    );
  }
  
  // Filter deliveries based on status and search term
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesStatus = statusFilter ? delivery.status === statusFilter : true;
    const matchesSearch = searchTerm 
      ? delivery.contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });
  
  // Calculate pagination
  const totalItems = filteredDeliveries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Ensure current page is within bounds
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  if (safeCurrentPage !== currentPage) {
    setCurrentPage(safeCurrentPage);
  }
  
  // Get current page of data
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedDeliveries = filteredDeliveries.slice(startIndex, startIndex + pageSize);
  
  // Helper function to format date
  const formatDate = (date: DateValue): string => {
    if (!date) return "—";
    // If it's already a Date object, use it directly
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  };
  
  // Calculate time differences
  const calculateTimeDiff = (start: DateValue, end: DateValue): string => {
    if (!start || !end) return "—";
    
    // Convert to Date objects if they are strings
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    
    const diffMs = endDate.getTime() - startDate.getTime();
    
    if (diffMs < 0) return "—";
    
    // Convert to seconds
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return `${diffSec}s`;
    } else if (diffSec < 3600) {
      return `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;
    } else {
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };
  
  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Delivered</span>;
      case 'OPENED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Opened</span>;
      case 'CLICKED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">Clicked</span>;
      case 'BOUNCED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Bounced</span>;
      case 'FAILED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Pending</span>;
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return <EnvelopeIcon className="h-5 w-5 text-blue-500" />;
      case 'OPENED':
        return <EnvelopeOpenIcon className="h-5 w-5 text-green-500" />;
      case 'CLICKED':
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-indigo-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
        </svg>;
      case 'BOUNCED':
      case 'FAILED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Function to export data as CSV
  const exportToCsv = () => {
    const headers = ['Email', 'Status', 'Sent At', 'Opened At', 'Clicked At', 'Time to Open', 'Time to Click', 'Error Message'];
    
    // Export all filtered data, not just current page
    const rows = filteredDeliveries.map(delivery => [
      delivery.contact.email,
      delivery.status,
      formatDate(delivery.sentAt),
      formatDate(delivery.openedAt),
      formatDate(delivery.clickedAt),
      calculateTimeDiff(delivery.sentAt, delivery.openedAt),
      calculateTimeDiff(delivery.sentAt, delivery.clickedAt),
      delivery.errorMessage ?? ''
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'campaign-analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Calculate failed deliveries for the notification section
  const failedCount = deliveries.filter(d => ['BOUNCED', 'FAILED'].includes(d.status)).length;
  
  // Function to generate the error message text based on filters
  const getErrorMessageText = () => {
    if (searchTerm && statusFilter) {
      return `No ${statusFilter.toLowerCase()} emails matching "${searchTerm}"`;
    }
    
    if (searchTerm) {
      return `No emails matching "${searchTerm}"`;
    }
    
    if (statusFilter) {
      return `No ${statusFilter.toLowerCase()} emails found`;
    }
    
    return 'No email delivery data available';
  };
  
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
  
  return (
    <Card>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
            Delivery Details
          </h2>
          
          <Button 
            variant="secondary"
            size="sm"
            onClick={exportToCsv}
            icon={<ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />}
          >
            Export CSV
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by email..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm("")}
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
              <option value="SENT">Delivered</option>
              <option value="OPENED">Opened</option>
              <option value="CLICKED">Clicked</option>
              <option value="BOUNCED">Bounced</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opened At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicked At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDeliveries.length > 0 ? (
                paginatedDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getStatusIcon(delivery.status)}
                        </div>
                        <div className="ml-3">
                          {getStatusBadge(delivery.status)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {delivery.contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(delivery.sentAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(delivery.openedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(delivery.clickedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calculateTimeDiff(delivery.sentAt, delivery.openedAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-900">No matching records found</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {getErrorMessageText()}
                      </p>
                      {(searchTerm || statusFilter) && (
                        <Button 
                          variant="outline-primary"
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter(null);
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {filteredDeliveries.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="mb-4 sm:mb-0 text-sm text-gray-500">
                Showing {Math.min(totalItems, startIndex + 1)}-{Math.min(totalItems, startIndex + pageSize)} of {totalItems} recipients
                {(searchTerm || statusFilter) && " with the current filters"}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <select
                    className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 p-1"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page when changing page size
                    }}
                  >
                    {[10, 25, 50, 100].map(size => (
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
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                          aria-current={currentPage === pageNumber ? 'page' : undefined}
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
        
        {failedCount > 0 && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="text-sm font-medium text-red-800 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Failed Deliveries
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {failedCount} {failedCount === 1 ? 'email' : 'emails'} failed to deliver. This could be due to invalid email addresses, 
              mailbox full, or other delivery issues.
            </p>
            <Button 
              variant="outline-danger"
              size="sm"
              className="mt-3"
              onClick={() => setStatusFilter('FAILED')}
            >
              View Failed Deliveries
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}