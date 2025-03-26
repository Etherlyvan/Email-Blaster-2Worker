// app/campaigns/create/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { sendToQueue, EMAIL_QUEUE, SCHEDULER_QUEUE } from "../../../lib/rabbitmq";
import { CampaignFormWithParams } from "../../../components/campaigns/CampaignFormWithParams";
import { Card } from "../../../components/ui/Card";
import Link from "next/link";
import { CampaignFormData } from "@/types/campaign";

async function CreateCampaignContent() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/dashboard");
  }
  
  const [brevoKeys, contactGroups] = await Promise.all([
    prisma.brevoKey.findMany({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactGroup.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { groupContacts: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);
  
  if (brevoKeys.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">No Brevo API Keys Available</h2>
          <p className="mt-2 text-sm text-gray-500">
            You need to add a Brevo API key before creating a campaign.
          </p>
          <div className="mt-6">
            <Link href="/settings" className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Go to Settings
            </Link>
          </div>
        </div>
      </Card>
    );
  }
  
  if (contactGroups.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">No Contact Groups Available</h2>
          <p className="mt-2 text-sm text-gray-500">
            You need to create a contact group before creating a campaign.
          </p>
          <div className="mt-6">
            <Link href="/groups/create" className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Create Group
            </Link>
          </div>
        </div>
      </Card>
    );
  }
  
  async function createCampaign(data: CampaignFormData, sendNow: boolean) {
    'use server';
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    
    let status: 'DRAFT' | 'SCHEDULED' | 'SENDING' = 'DRAFT';
    let schedule: Date | undefined = undefined;
    
    if (sendNow) {
      status = 'SENDING';
    } else if (data.schedule) {
      status = 'SCHEDULED';
      schedule = new Date(data.schedule);
    }
    
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        content: data.content,
        brevoKeyId: data.brevoKeyId,
        groupId: data.groupId,
        userId: session.user.id,
        status,
        schedule,
      },
    });
    
    // If sending now, queue it for immediate processing
    if (sendNow) {
      await sendToQueue(EMAIL_QUEUE, { campaignId: campaign.id });
    } 
    // If scheduled, add to scheduler queue
    else if (schedule) {
      await sendToQueue(SCHEDULER_QUEUE, { 
        campaignId: campaign.id,
        scheduledTime: schedule.toISOString()
      });
    }
    
    revalidatePath("/campaigns");
    redirect("/campaigns");
  }
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          
          <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <div className="p-6">
          <CampaignFormWithParams 
            brevoKeys={brevoKeys}
            contactGroups={contactGroups}
            onSubmitAction={createCampaign}
          />
        </div>
      </Card>
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            <p className="text-lg font-medium text-gray-700">Loading campaign editor...</p>
          </div>
        </div>
      }>
        <CreateCampaignContent />
      </Suspense>
    </div>
  );
}