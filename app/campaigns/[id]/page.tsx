// app/campaigns/[id]/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { CampaignProgress } from "../../../components/campaigns/CampaignProgress";
import { CampaignDetailActions } from "../../../components/campaigns/CampaignDetailActions";
import { EmailContentPreview } from "../../../components/campaigns/EmailContentPreview";
import { Campaign } from "../../../types/campaign";

// Define type for params using Promise
interface PageProps {
  readonly params: Promise<{ id: string }>;
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

interface CampaignDetailContentProps {
  readonly params: Promise<{ id: string }>;
}

async function CampaignDetailContent({ params }: CampaignDetailContentProps) {
  // Await the params to resolve
  const { id } = await params;
  
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
    },
  });
  
  if (!campaignData) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          Campaign not found. It may have been deleted.
        </div>
        <div>
          <Link href="/campaigns">
            <Button variant="outline">Back to Campaigns</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Convert to Campaign type with proper handling for null values
  const campaign: Campaign & { content: string } = {
    ...campaignData,
    brevoKeyId: campaignData.brevoKeyId ?? null, // Using nullish coalescing
    brevoKey: campaignData.brevoKey ?? null
  };
  
  // Log for debugging the HTML content
  console.log("Campaign content length:", campaign.content?.length ?? 0);
  console.log("Campaign content preview:", campaign.content?.substring(0, 100));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Campaign: {campaign.name}</h1>
        <div className="flex space-x-2">
          <Link href="/campaigns">
            <Button variant="outline">Back to Campaigns</Button>
          </Link>
          
          <CampaignDetailActions campaign={campaign} />
        </div>
      </div>
      
      <Card>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p>
                <span className={`mt-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(campaign.status)}`}>
                  {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
                </span>
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(campaign.createdAt).toLocaleString()}
              </p>
            </div>
            
            {campaign.schedule && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Scheduled</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(campaign.schedule).toLocaleString()}
                </p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Group</h3>
              <p className="mt-1 text-sm text-gray-900">
                {campaign.group?.name ?? campaign.groupId}
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Email Details</h3>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Subject</p>
                <p className="text-sm font-medium">{campaign.subject}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">From</p>
                <p className="text-sm font-medium">{campaign.senderName} &lt;{campaign.senderEmail}&gt;</p>
              </div>
            </div>
          </div>
          
          {campaign.status === 'SENDING' && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Sending Progress</h3>
              <CampaignProgress campaignId={campaign.id} />
            </div>
          )}
        </div>
      </Card>
      
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Email Content</h2>
          <div className="border rounded-md p-4 bg-white">
            {campaign.content ? (
              <>
                <div className="mb-4">
                  <EmailContentPreview htmlContent={campaign.content} />
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    View Raw HTML
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md overflow-auto max-h-[300px]">
                    <pre className="text-xs text-gray-700">{campaign.content}</pre>
                  </div>
                </details>
              </>
            ) : (
              <p className="text-gray-500 italic">No content available</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CampaignDetailPage({ params }: PageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div>Loading campaign details...</div>}>
        <CampaignDetailContent params={params} />
      </Suspense>
    </div>
  );
}