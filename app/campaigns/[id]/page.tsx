// app/campaigns/[id]/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { CampaignDetailActions } from "../../../components/campaigns/CampaignDetailActions";
import { CampaignDetailStats } from "../../../components/campaigns/CampaignDetailStats";
import { EmailContentPreview } from "../../../components/campaigns/EmailContentPreview";
import { 
  ChartBarIcon, 
  ClockIcon, 
  UserGroupIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Skeleton loader for campaign details
function CampaignDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="flex space-x-2">
          <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 space-y-6">
          <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-6 w-full bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

function getStatusBadgeClasses(status: string): string {
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
}

// Status icon component
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'SENT':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'SENDING':
      return <PaperAirplaneIcon className="h-5 w-5 text-blue-500" />;
    case 'SCHEDULED':
      return <CalendarIcon className="h-5 w-5 text-yellow-500" />;
    case 'FAILED':
      return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
    default:
      return <EnvelopeIcon className="h-5 w-5 text-gray-500" />;
  }
}

// Main campaign detail component
async function CampaignDetail({ id }: { id: string }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/dashboard");
  }
  
  const campaignData = await prisma.campaign.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      group: true,
      brevoKey: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: { EmailDelivery: true }
      }
    },
  });
  
  if (!campaignData) {
    notFound();
  }
  
  // Get delivery stats
  const deliveryStats = await prisma.emailDelivery.groupBy({
    by: ['status'],
    where: { campaignId: id },
    _count: true
  });
  
  const stats = deliveryStats.reduce((acc, stat) => {
    acc[stat.status] = stat._count;
    return acc;
  }, {} as Record<string, number>);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center">
            <StatusIcon status={campaignData.status} />
            <h1 className="text-2xl font-bold text-gray-900 ml-2">{campaignData.name}</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {campaignData.status === 'DRAFT' ? 'Draft campaign' : 
             campaignData.status === 'SENDING' ? 'Campaign is currently sending' :
             campaignData.status === 'SCHEDULED' ? `Scheduled for ${formatDate(campaignData.schedule as Date)}` :
             campaignData.status === 'SENT' ? 'Campaign has been sent' : 'Campaign failed to send'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link href="/campaigns">
            <Button 
              variant="secondary"
              size="sm"
              icon={<ArrowLeftIcon className="h-4 w-4 mr-1.5" />}
            >
              Back to Campaigns
            </Button>
          </Link>
          
          {campaignData.status === 'SENT' && (
            <Link href={`/campaigns/${id}/analytics`}>
              <Button 
                variant="primary"
                size="sm"
                icon={<ChartBarIcon className="h-4 w-4 mr-1.5" />}
              >
                Analytics
              </Button>
            </Link>
          )}
          
          <CampaignDetailActions campaign={campaignData} />
        </div>
      </div>
      
      {campaignData.status === 'SENT' && (
        <CampaignDetailStats campaignId={id} stats={stats} totalCount={campaignData._count?.EmailDelivery || 0} />
      )}
      
      <Card>
        <div className="p-6 space-y-5">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-500" />
            Campaign Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="mt-1 flex items-center">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(campaignData.status)}`}>
                  {campaignData.status.charAt(0) + campaignData.status.slice(1).toLowerCase()}
                </span>
                <span className="ml-2 text-sm text-gray-700">
                  {campaignData.status === 'DRAFT' ? 'Not sent yet' : 
                   campaignData.status === 'SENDING' ? 'Email delivery in progress' :
                   campaignData.status === 'SCHEDULED' ? 'Waiting to be sent at scheduled time' :
                   campaignData.status === 'SENT' ? `Sent to ${campaignData._count?.EmailDelivery} recipient${campaignData._count?.EmailDelivery !== 1 ? 's' : ''}` : 
                   'Delivery failed'}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1 text-sm text-gray-900 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                {formatDate(campaignData.createdAt)}
              </p>
            </div>
            
            {campaignData.schedule && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                  Scheduled
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(campaignData.schedule as Date)}
                </p>
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                Contact Group
              </h3>
              <p className="mt-1 text-sm text-gray-900">
                {campaignData.group?.name ?? "Unknown group"}
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Email Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Subject</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{campaignData.subject}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">From</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{campaignData.senderName} &lt;{campaignData.senderEmail}&gt;</p>
                </div>
              </div>
            </div>
          </div>
          
          {campaignData.brevoKey && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Delivery Settings</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">Brevo API Key</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{campaignData.brevoKey.name}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-500" />
            Email Content
          </h2>
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center">
              <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Email Preview</span>
            </div>
            
            <div className="p-4">
              {campaignData.content ? (
                <Suspense fallback={<div className="h-64 bg-gray-100 rounded-md animate-pulse"></div>}>
                  <EmailContentPreview htmlContent={campaignData.content} />
                </Suspense>
              ) : (
                <div className="py-12 text-center">
                  <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No content available</h3>
                  <p className="mt-1 text-sm text-gray-500">This campaign doesn&apos;t have any email content.</p>
                </div>
              )}
            </div>
          </div>
          
          {campaignData.content && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                View Raw HTML
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded-md overflow-auto max-h-[300px] border border-gray-200">
                <pre className="text-xs font-mono text-gray-700">{campaignData.content}</pre>
              </div>
            </details>
          )}
        </div>
      </Card>
    </div>
  );
}

// Main page component with Promise params as required by your Next.js config
export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params promise to get the actual id
  const { id } = await params;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<CampaignDetailSkeleton />}>
        <CampaignDetail id={id} />
      </Suspense>
    </div>
  );
}