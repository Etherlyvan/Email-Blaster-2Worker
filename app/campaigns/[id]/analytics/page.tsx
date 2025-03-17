// app/campaigns/[id]/analytics/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";

// Updated type for Next.js 15
interface PageProps {
  readonly params: Promise<{ id: string }>;
}

// Create a proper interface with readonly props
interface CampaignAnalyticsContentProps {
  readonly params: Promise<{ id: string }>;
}

// Helper function to determine status color
const getStatusBadgeClass = (status: string): string => {
  if (status === 'SENT' || status === 'DELIVERED') {
    return 'bg-green-100 text-green-800';
  } else if (status === 'OPENED') {
    return 'bg-blue-100 text-blue-800';
  } else if (status === 'CLICKED') {
    return 'bg-indigo-100 text-indigo-800';
  } else if (status === 'BOUNCED' || status === 'FAILED') {
    return 'bg-red-100 text-red-800';
  } else {
    return 'bg-gray-100 text-gray-800';
  }
};

async function CampaignAnalyticsContent({ params }: CampaignAnalyticsContentProps) {
  // Await the params promise to get the actual values
  const { id } = await params;
  
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
    },
  });
  
  if (!campaign) {
    notFound();
  }
  
  // Get email delivery stats
  const deliveries = await prisma.emailDelivery.findMany({
    where: {
      campaignId: id,
    },
    include: {
      contact: true,
    },
  });
  
  // Calculate statistics
  const totalCount = deliveries.length;
  const sentCount = deliveries.filter(d => d.status === 'SENT' || d.status === 'DELIVERED' || d.status === 'OPENED' || d.status === 'CLICKED').length;
  const openedCount = deliveries.filter(d => d.status === 'OPENED' || d.status === 'CLICKED').length;
  const clickedCount = deliveries.filter(d => d.status === 'CLICKED').length;
  const bouncedCount = deliveries.filter(d => d.status === 'BOUNCED').length;
  const failedCount = deliveries.filter(d => d.status === 'FAILED').length;
  
  const openRate = totalCount > 0 ? Math.round((openedCount / totalCount) * 100) : 0;
  const clickRate = totalCount > 0 ? Math.round((clickedCount / totalCount) * 100) : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Campaign Analytics: {campaign.name}</h1>
        <Link href={`/campaigns/${id}`}>
          <Button variant="outline">Back to Campaign</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium text-gray-900">Total Recipients</h3>
            <p className="mt-2 text-3xl font-bold">{totalCount}</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium text-gray-900">Delivered</h3>
            <p className="mt-2 text-3xl font-bold">{sentCount}</p>
            <p className="text-sm text-gray-500">{totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0}%</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium text-gray-900">Opens</h3>
            <p className="mt-2 text-3xl font-bold">{openedCount}</p>
            <p className="text-sm text-gray-500">{openRate}% open rate</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium text-gray-900">Clicks</h3>
            <p className="mt-2 text-3xl font-bold">{clickedCount}</p>
            <p className="text-sm text-gray-500">{clickRate}% click rate</p>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium text-gray-900">Bounced</h3>
            <p className="mt-2 text-3xl font-bold">{bouncedCount}</p>
            <p className="text-sm text-gray-500">{totalCount > 0 ? Math.round((bouncedCount / totalCount) * 100) : 0}%</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium text-gray-900">Failed</h3>
            <p className="mt-2 text-3xl font-bold">{failedCount}</p>
            <p className="text-sm text-gray-500">{totalCount > 0 ? Math.round((failedCount / totalCount) * 100) : 0}%</p>
          </div>
        </Card>
      </div>
      
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opened At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {delivery.contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {delivery.sentAt ? new Date(delivery.sentAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {delivery.openedAt ? new Date(delivery.openedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-500">
                      {delivery.errorMessage ?? '-'}
                    </td>
                  </tr>
                ))}
                
                {deliveries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No delivery data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CampaignAnalyticsPage({ params }: PageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div>Loading analytics...</div>}>
        <CampaignAnalyticsContent params={params} />
      </Suspense>
    </div>
  );
}