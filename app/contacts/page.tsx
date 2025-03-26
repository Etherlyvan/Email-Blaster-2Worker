// app/contacts/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { ContactsPageContent } from "../../components/contacts/ContactsPageContent";

function ContactsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-40 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="flex space-x-2">
          <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="h-10 w-64 bg-gray-100 rounded-md animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-100 rounded-md animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {/* Fixed: Don't use array index as key */}
            <div key="skeleton-1" className="h-16 bg-gray-100 rounded-md animate-pulse"></div>
            <div key="skeleton-2" className="h-16 bg-gray-100 rounded-md animate-pulse"></div>
            <div key="skeleton-3" className="h-16 bg-gray-100 rounded-md animate-pulse"></div>
            <div key="skeleton-4" className="h-16 bg-gray-100 rounded-md animate-pulse"></div>
            <div key="skeleton-5" className="h-16 bg-gray-100 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContactsContentProps {
  readonly page: number;
  readonly groupId?: string;
}

async function ContactsContent({ page, groupId }: ContactsContentProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/dashboard");
  }
  
  const pageSize = 10; // Number of contacts per page
  
  // Build the where clause for the query with proper typing
  // Fixed: Use a properly typed where clause instead of any
  const whereClause: {
    userId: string;
    groupContacts?: {
      some: {
        contactGroupId: string;
      };
    };
  } = { 
    userId: session.user.id 
  };
  
  // Add group filter if provided
  if (groupId) {
    whereClause.groupContacts = {
      some: {
        contactGroupId: groupId
      }
    };
  }
  
  // Execute queries in parallel
  const [contactsData, totalContacts, contactGroups] = await Promise.all([
    // Get paginated contacts
    prisma.contact.findMany({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        groupContacts: {
          include: {
            contactGroup: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { EmailDelivery: true }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    
    // Get total count for pagination
    prisma.contact.count({
      where: whereClause
    }),
    
    // Get all contact groups
    prisma.contactGroup.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);
  
  // Get email stats for each contact
  const contactsWithStats = await Promise.all(
    contactsData.map(async (contact) => {
      const stats = await prisma.emailDelivery.groupBy({
        by: ['status'],
        where: { contactId: contact.id },
        _count: true
      });
      
      const statsMap = stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>);
      
      // Transform additionalData to match the expected type
      const typedAdditionalData = contact.additionalData 
        ? (contact.additionalData as Record<string, string | number | boolean | null>)
        : undefined;
      
      return {
        ...contact,
        additionalData: typedAdditionalData,
        stats: statsMap,
        createdAt: contact.createdAt.toISOString() // Convert Date to string for serialization
      };
    })
  );
  
  return (
    <ContactsPageContent 
      contacts={contactsWithStats} 
      groups={contactGroups}
      pagination={{
        currentPage: page,
        totalPages: Math.ceil(totalContacts / pageSize),
        totalItems: totalContacts,
        pageSize
      }}
    />
  );
}

// Fixed: Mark props as readonly
export default function ContactsPage({
  searchParams
}: {
  readonly searchParams: { readonly page?: string, readonly groupId?: string }
}) {
  // Parse page parameter, default to 1
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<ContactsPageSkeleton />}>
        <ContactsContent page={page} groupId={searchParams.groupId} />
      </Suspense>
    </div>
  );
}