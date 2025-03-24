// app/dashboard/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { GoogleLoginButton } from "../../components/auth/GoogleLoginButton";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";


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
    const [contactCount, groupCount, campaignCount, brevoKeyCount, recentCampaigns] = await Promise.all([
      prisma.contact.count({ where: { userId: session.user.id } }),
      prisma.contactGroup.count({ where: { userId: session.user.id } }),
      prisma.campaign.count({ where: { userId: session.user.id } }),
      prisma.brevoKey.count({ where: { userId: session.user.id } }),
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link href="/campaigns/create">
            <Button variant="primary">Create Campaign</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
  