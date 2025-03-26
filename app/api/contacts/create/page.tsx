// app/contacts/create/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ContactForm } from "@/components/contacts/ContactForm";

function ContactCreateSkeleton() {
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

async function ContactCreateContent() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/dashboard");
  }
  
  const groups = await prisma.contactGroup.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add New Contact</h1>
      <ContactForm groups={groups} />
    </div>
  );
}

export default function CreateContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<ContactCreateSkeleton />}>
        <ContactCreateContent />
      </Suspense>
    </div>
  );
}