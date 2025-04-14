// app/settings/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { BrevoKeyActions } from "../../components/brevo/BrevoKeyActions";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface BrevoKey {
  id: string;
  name: string;
  apiKey: string;
  smtpUsername: string;
  smtpPassword: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Improved "Add Brevo Key" form component
function AddBrevoKeyForm({ onSubmit }: { readonly onSubmit: (formData: FormData) => void }) {
  return (
    <Card className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Add New API Key</h2>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Enter your Brevo API credentials to connect your account. These credentials will be used to send emails.
        </p>
        
        <form action={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Key Name
            </label>
            <Input
              type="text"
              id="name"
              name="name"
              required
              placeholder="My Brevo Key"
              className="mt-1 w-full"
            />
            <p className="mt-1 text-xs text-gray-500">A friendly name to identify this key</p>
          </div>
          
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              API Key
            </label>
            <Input
              type="text"
              id="apiKey"
              name="apiKey"
              required
              placeholder="xkeysib-..."
              className="mt-1 w-full font-mono"
            />
            <p className="mt-1 text-xs text-gray-500">Find this in your Brevo account settings</p>
          </div>
          
          <div>
            <label htmlFor="smtpUsername" className="block text-sm font-medium text-gray-700">
              SMTP Username
            </label>
            <Input
              type="text"
              id="smtpUsername"
              name="smtpUsername"
              required
              placeholder="smtp-username"
              className="mt-1 w-full"
            />
          </div>
          
          <div>
            <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700">
              SMTP Password
            </label>
            <Input
              type="password"
              id="smtpPassword"
              name="smtpPassword"
              required
              placeholder="••••••••"
              className="mt-1 w-full"
            />
          </div>
          
          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="flex items-center justify-center"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Add API Key
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

// Improved table for Brevo Keys
function BrevoKeysTable({ keys }: { readonly keys: readonly BrevoKey[] }) {
  if (keys.length === 0) {
    return (
      <div className="text-center py-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys added yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding your first Brevo API key.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SMTP Username
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {keys.map((key) => (
            <tr key={key.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{key.name}</div>
                    <div className="text-xs text-gray-500">Added on {new Date(key.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                {key.smtpUsername}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {key.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <BrevoKeyActions keyId={key.id} isActive={key.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function SettingsContent() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/dashboard");
  }
  
  const brevoKeys = await prisma.brevoKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  
  async function addBrevoKey(formData: FormData) {
    "use server";
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    
    const name = formData.get("name") as string;
    const apiKey = formData.get("apiKey") as string;
    const smtpUsername = formData.get("smtpUsername") as string;
    const smtpPassword = formData.get("smtpPassword") as string;
    
    await prisma.brevoKey.create({
      data: {
        name,
        apiKey,
        smtpUsername,
        smtpPassword,
        userId: session.user.id,
      },
    });
    
    redirect("/settings");
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">API Settings</h1>
        <div>
          
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Brevo API Keys</h2>
                <div className="text-sm text-gray-500">{brevoKeys.length} keys</div>
              </div>
              
              <BrevoKeysTable keys={brevoKeys} />
              
              <div className="mt-6 text-sm text-gray-500">
                <p>API keys are used to authenticate your requests to the Brevo API. Keep your API keys secure and never share them publicly.</p>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <AddBrevoKeyForm onSubmit={addBrevoKey} />
          
          <div className="mt-6">
            <Card className="bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-800">Need Help?</h3>
              <p className="mt-1 text-xs text-gray-600">
                You can find your Brevo API keys in your Brevo account under SMTP & API section. 
                For more information, check the <a href="https://developers.brevo.com/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Brevo Documentation</a>.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-gray-200"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mt-4"></div>
            <div className="h-3 w-24 bg-gray-200 rounded mt-2"></div>
          </div>
        </div>
      }>
        <SettingsContent />
      </Suspense>
    </div>
  );
}