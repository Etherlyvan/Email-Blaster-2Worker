// app/contacts/edit/[id]/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { ContactForm } from "../../../../components/contacts/ContactForm";

interface PageProps {
  readonly params: { id: string };
}

function ContactEditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse"></div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-6">
          <div className="h-6 w-32 bg-gray-100 rounded-md animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-100 rounded-md animate-pulse"></div>
              <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-100 rounded-md animate-pulse"></div>
              <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-100 rounded-md animate-pulse"></div>
            <div className="h-32 w-full bg-gray-100 rounded-md animate-pulse"></div>
          </div>
          <div className="flex justify-end space-x-4">
            <div className="h-10 w-24 bg-gray-100 rounded-md animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fixed the parameter to be readonly
async function ContactEditContent({ id }: { readonly id: string }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/dashboard");
  }
  
  const [contact, groups] = await Promise.all([
    prisma.contact.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
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
      },
    }),
    prisma.contactGroup.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);
  
  if (!contact) {
    notFound();
  }
  
  // Create a properly typed initialData object that matches ContactForm's expected props
  const initialData = {
    id: contact.id,
    email: contact.email,
    // Convert JsonValue to the expected Record type with a type assertion
    additionalData: contact.additionalData as Record<string, string | number | boolean | null> | undefined,
    groupContacts: contact.groupContacts.map(gc => ({
      contactGroup: {
        id: gc.contactGroup.id
      }
    }))
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Contact</h1>
      <ContactForm 
        groups={groups}
        initialData={initialData}
      />
    </div>
  );
}

export default function EditContactPage({ params }: PageProps) {
  const { id } = params;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<ContactEditSkeleton />}>
        <ContactEditContent id={id} />
      </Suspense>
    </div>
  );
}