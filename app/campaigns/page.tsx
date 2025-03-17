// app/campaigns/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { CampaignList } from "../../components/campaigns/CampaignList";
import { Button } from "../../components/ui/Button";

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
    },
    orderBy: { createdAt: "desc" },
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link href="/campaigns/create">
          <Button>Create Campaign</Button>
        </Link>
      </div>
      
      <CampaignList campaigns={campaigns} />
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div>Loading campaigns...</div>}>
        <CampaignsContent />
      </Suspense>
    </div>
  );
}