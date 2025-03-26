// app/templates/[id]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { TemplateEditorWrapper } from "../../../components/templates/TemplateEditorWrapper";

interface PageProps {
  readonly params: Promise<{ id: string }>;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateEditorContentProps {
  readonly params: Promise<{ id: string }>;
}

async function TemplateEditorContent({ params }: TemplateEditorContentProps) {
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return (
      <div className="p-6 bg-red-50 rounded-md">
        <h2 className="text-lg font-medium text-red-800">Authentication Required</h2>
        <p className="mt-2 text-sm text-red-700">Please sign in to access this page.</p>
      </div>
    );
  }
  
  const template = await prisma.emailTemplate.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
  });
  
  if (!template) {
    notFound();
  }
  
  const templateData: EmailTemplate = {
    id: template.id,
    name: template.name,
    description: template.description ?? "",
    content: template.content,
    htmlContent: template.htmlContent,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
  
  return (
    <TemplateEditorWrapper 
      initialData={templateData}
    />
  );
}

export default function EditTemplatePage({ params }: PageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div>Loading template...</div>}>
        <TemplateEditorContent params={params} />
      </Suspense>
    </div>
  );
}