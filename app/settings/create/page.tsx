// app/campaigns/create/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { sendToQueue, EMAIL_QUEUE, SCHEDULER_QUEUE } from "../../../lib/rabbitmq";
import { Card } from "../../../components/ui/Card";
import Link from "next/link";

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
        <div className="p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900">No Brevo Keys Available</h2>
          <p className="mt-2 text-sm text-gray-500">
            You need to add a Brevo API key before creating a campaign.
          </p>
          <div className="mt-4">
            <a
              href="/settings"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Settings
            </a>
          </div>
        </div>
      </Card>
    );
  }
  
  if (contactGroups.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900">No Contact Groups Available</h2>
          <p className="mt-2 text-sm text-gray-500">
            You need to create a contact group before creating a campaign.
          </p>
          <div className="mt-4">
            <Link
            href="/groups/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Create Group
            </Link>
          </div>
        </div>
      </Card>
    );
  }
  
  async function createCampaign(formData: FormData) {
    "use server";
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    
    const name = formData.get("name") as string;
    const subject = formData.get("subject") as string;
    const senderName = formData.get("senderName") as string;
    const senderEmail = formData.get("senderEmail") as string;
    const content = formData.get("htmlContent") as string; // Get HTML content from the textarea
    const brevoKeyId = formData.get("brevoKeyId") as string;
    const groupId = formData.get("groupId") as string;
    const scheduleStr = formData.get("schedule") as string;
    const sendNow = formData.get("sendNow") === "true";
    
    let status: 'DRAFT' | 'SCHEDULED' | 'SENDING' = 'DRAFT';
    let schedule: Date | undefined = undefined;
    
    if (sendNow) {
      status = 'SENDING';
    } else if (scheduleStr) {
      status = 'SCHEDULED';
      schedule = new Date(scheduleStr);
    }
    
    const campaign = await prisma.campaign.create({
      data: {
        name,
        subject,
        senderName,
        senderEmail,
        content, // Use content field instead of htmlContent
        brevoKey: {
          connect: { id: brevoKeyId },
        },
        group: {
          connect: { id: groupId },
        },
        user: {
          connect: { id: session.user.id },
        },
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
      <h1 className="text-2xl font-bold mb-6">Create Campaign</h1>
      
      <Card>
        <div className="p-6">
          <form action={createCampaign} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Campaign Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Summer Sale Announcement"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Email Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Don't miss our summer sale!"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="senderName" className="block text-sm font-medium text-gray-700">
                  Sender Name
                </label>
                <input
                  type="text"
                  id="senderName"
                  name="senderName"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700">
                  Sender Email
                </label>
                <input
                  type="email"
                  id="senderEmail"
                  name="senderEmail"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brevoKeyId" className="block text-sm font-medium text-gray-700">
                  Brevo Key
                </label>
                <select
                  id="brevoKeyId"
                  name="brevoKeyId"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {brevoKeys.map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="groupId" className="block text-sm font-medium text-gray-700">
                  Contact Group
                </label>
                <select
                  id="groupId"
                  name="groupId"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {contactGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group._count?.groupContacts || 0} contacts)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="schedule" className="block text-sm font-medium text-gray-700">
                Schedule (Optional)
              </label>
              <input
                type="datetime-local"
                id="schedule"
                name="schedule"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            
            <div>
              <label htmlFor="htmlContent" className="block text-sm font-medium text-gray-700">
                Email Content
              </label>
              <textarea
                id="htmlContent"
                name="htmlContent"
                rows={10}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="<p>Write your HTML email content here...</p>"
                defaultValue="<p>Write your email content here...</p>"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-4">
            <Link
            href="/campaigns"
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Cancel
            </Link>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                name="sendNow"
                value="true"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Send Now
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <CreateCampaignContent />
      </Suspense>
    </div>
  );
}