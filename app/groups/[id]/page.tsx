// app/groups/[id]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import Link from "next/link";
import { GroupDetailWrapper } from "@/components/groups/GroupDetailsWrapper";
import { Button } from "../../../components/ui/Button";

// Define the types that match the GroupDetailWrapper component's expectations
interface Contact {
  id: string;
  email: string;
  additionalData?: Record<string, unknown>;
}

interface GroupContact {
  contact: Contact;
}

interface ContactGroup {
  id: string;
  name: string;
  groupContacts: GroupContact[];
}

// Define the params type correctly for Next.js with readonly
interface PageProps {
  readonly params: Promise<{ id: string }>;
}

interface GroupDetailContentProps {
  readonly params: Promise<{ id: string }>;
}

async function GroupDetailContent({ params }: GroupDetailContentProps) {
  // Await the params promise to get the actual values
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return (
      <div className="p-6 bg-red-50 rounded-md">
        <h2 className="text-lg font-medium text-red-800">Authentication Required</h2>
        <p className="mt-2 text-sm text-red-700">Please sign in to access this page.</p>
        <div className="mt-4">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const groupData = await prisma.contactGroup.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      groupContacts: {
        include: {
          contact: true,
        },
      },
    },
  });
  
  if (!groupData) {
    notFound();
  }
  
  // Convert the Prisma data to the expected type format
  const group: ContactGroup = {
    id: groupData.id,
    name: groupData.name,
    groupContacts: groupData.groupContacts.map(gc => ({
      contact: {
        id: gc.contact.id,
        email: gc.contact.email,
        // Convert JsonValue to Record<string, unknown> | undefined
        additionalData: gc.contact.additionalData as Record<string, unknown> | undefined
      }
    }))
  };
  
  return (
    <GroupDetailWrapper
      initialGroup={group}
      // Remove the userId prop since it's no longer part of the component props
    />
  );
}

export default function GroupDetailPage({ params }: PageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div>Loading group details...</div>}>
        <GroupDetailContent params={params} />
      </Suspense>
    </div>
  );
}