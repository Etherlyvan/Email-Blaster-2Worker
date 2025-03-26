// app/campaigns/[id]/analytics/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { Button } from "../../../../components/ui/Button";
import { CampaignAnalytics } from "../../../../components/campaigns/CampaignAnalytics";
import { CampaignDetailStats } from "../../../../components/campaigns/CampaignDetailStats";
import { 
  ArrowLeftIcon, 
  ChartBarIcon
} from "@heroicons/react/24/outline";

// Skeleton loader for analytics page
function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Fix SonarLint S6479 by using unique keys instead of array indices */}
        <div key="skeleton-stat-1" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div key="skeleton-stat-2" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div key="skeleton-stat-3" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div key="skeleton-stat-4" className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-6"></div>
        <div className="h-64 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
    </div>
  );
}

// Type definition for params
interface PageProps {
  readonly params: { id: string }; // Made readonly to fix S6759
}

// Helper function to format date
function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d);
}

// Main analytics component
async function CampaignAnalyticsContent({ id }: { readonly id: string }) { // Made readonly to fix S6759
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/dashboard");
  }
  
  const campaign = await prisma.campaign.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      group: true,
      _count: {
        select: { EmailDelivery: true }
      }
    },
  });
  
  if (!campaign) {
    notFound();
  }
  
  if (campaign.status !== 'SENT') {
    redirect(`/campaigns/${id}`);
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
  
  // Get email deliveries
  const deliveries = await prisma.emailDelivery.findMany({
    where: {
      campaignId: id,
    },
    include: {
      contact: true,
    },
    orderBy: [
      { status: 'asc' }, 
      { sentAt: 'desc' }
    ],
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Analytics: {campaign.name}</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Campaign sent on {formatDate(campaign.createdAt)} to {campaign.group.name}
          </p>
        </div>
        <Link href={`/campaigns/${id}`}>
          <Button 
            variant="secondary"
            size="sm"
            icon={<ArrowLeftIcon className="h-4 w-4 mr-1.5" />}
          >
            Back to Campaign
          </Button>
        </Link>
      </div>
      
      <CampaignDetailStats campaignId={id} stats={stats} totalCount={campaign._count.EmailDelivery} />
      
      <CampaignAnalytics deliveries={deliveries} />
    </div>
  );
}

// Main page component
export default function CampaignAnalyticsPage({ params }: PageProps) {
  const { id } = params;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<AnalyticsPageSkeleton />}>
        <CampaignAnalyticsContent id={id} />
      </Suspense>
    </div>
  );
}