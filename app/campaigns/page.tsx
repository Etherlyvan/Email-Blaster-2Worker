// app/campaigns/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { CampaignList } from "../../components/campaigns/CampaignList";
import { Button } from "../../components/ui/Button";

function CampaignsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-40 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded-md animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function CampaignsContent() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/dashboard");
  }
  
  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
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
    orderBy: { createdAt: "desc" },
  });
  
  // Get stats for each campaign
  const campaignsWithStats = await Promise.all(
    campaigns.map(async (campaign) => {
      const stats = await prisma.emailDelivery.groupBy({
        by: ['status'],
        where: { campaignId: campaign.id },
        _count: true
      });
      
      const statsMap = stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        ...campaign,
        stats: statsMap
      };
    })
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">Create, manage, and track your email marketing campaigns</p>
        </div>
        <Link href="/campaigns/create">
          <Button variant="primary" className="w-full sm:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Create New Campaign
          </Button>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <CampaignList campaigns={campaignsWithStats} />
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<CampaignsPageSkeleton />}>
        <CampaignsContent />
      </Suspense>
    </div>
  );
}