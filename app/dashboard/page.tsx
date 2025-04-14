// app/dashboard/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { GoogleLoginButton } from "../../components/auth/GoogleLoginButton";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { VerificationNotification } from "@/components/senders/VerificationNotification";

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

async function DashboardContent() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <h1 className="text-2xl font-bold">Welcome to Email Campaign App</h1>
          <p className="text-gray-600 mb-4">Please sign in to get started</p>
          <GoogleLoginButton />
        </div>
      );
    }
    
    // Fetch counts
    const [contactCount, groupCount, campaignCount, brevoKeyCount, senderCount, recentCampaigns] = await Promise.all([
      prisma.contact.count({ where: { userId: session.user.id } }),
      prisma.contactGroup.count({ where: { userId: session.user.id } }),
      prisma.campaign.count({ where: { userId: session.user.id } }),
      prisma.brevoKey.count({ where: { userId: session.user.id } }),
      prisma.brevoSender.count({ where: { userId: session.user.id } }),
      prisma.campaign.findMany({
        where: { userId: session.user.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          group: true,
        }
      })
    ]);
    
    return (
      <div className="space-y-6">
        <VerificationNotification />
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link href="/campaigns/create">
            <Button variant="primary">Create Campaign</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900">Contacts</h2>
              <p className="mt-2 text-3xl font-bold">{contactCount}</p>
              <div className="mt-4">
                <Link href="/contacts">
                  <Button variant="info" size="sm">View All</Button>
                </Link>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900">Groups</h2>
              <p className="mt-2 text-3xl font-bold">{groupCount}</p>
              <div className="mt-4">
                <Link href="/groups">
                  <Button variant="info" size="sm">View All</Button>
                </Link>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900">Campaigns</h2>
              <p className="mt-2 text-3xl font-bold">{campaignCount}</p>
              <div className="mt-4">
                <Link href="/campaigns">
                  <Button variant="info" size="sm">View All</Button>
                </Link>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900">Brevo Keys</h2>
              <p className="mt-2 text-3xl font-bold">{brevoKeyCount}</p>
              <div className="mt-4">
                <Link href="/settings">
                  <Button variant="info" size="sm">Manage</Button>
                </Link>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900">Verified Senders</h2>
              <p className="mt-2 text-3xl font-bold">{senderCount}</p>
              <div className="mt-4">
                <Link href="/senders">
                  <Button variant="info" size="sm">Manage</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Campaigns</h2>
          {recentCampaigns.length > 0 ? (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {campaign.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.group.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(campaign.status)}`}>
                            {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/campaigns/${campaign.id}`}>
                          <Button variant="link" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card>
              <div className="p-6 text-center">
                <p className="text-gray-500">No campaigns yet</p>
                <div className="mt-4">
                  <Link href="/campaigns/create">
                    <Button>Create Your First Campaign</Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/contacts/import" className="block">
                  <Button variant="outline-primary" className="w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Import Contacts
                  </Button>
                </Link>
                <Link href="/groups/create" className="block">
                  <Button variant="outline-primary" className="w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Create Group
                  </Button>
                </Link>
                <Link href="/templates/create" className="block">
                  <Button variant="outline-primary" className="w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                    Create Template
                  </Button>
                </Link>
                <Link href="/senders" className="block">
                  <Button variant="outline-primary" className="w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Manage Senders
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Getting Started</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">1</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Set up your Brevo API keys</h3>
                    <p className="text-sm text-gray-500">Configure your Brevo API keys in the settings page to enable email sending.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">2</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Verify your sender email addresses</h3>
                    <p className="text-sm text-gray-500">Add and verify sender email addresses to improve deliverability.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">3</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Import your contacts</h3>
                    <p className="text-sm text-gray-500">Upload your contact list from a CSV or Excel file and organize them into groups.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">4</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Create and send your campaign</h3>
                    <p className="text-sm text-gray-500">Design your email, select your audience, and schedule or send your campaign.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
}
  
export default function DashboardPage() {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <DashboardContent />
        </Suspense>
      </div>
    );
}