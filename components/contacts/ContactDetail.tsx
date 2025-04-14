// components/contacts/ContactDetail.tsx
"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";
import { 
  XMarkIcon, 
  UserIcon, 
  EnvelopeIcon, 
  TagIcon, 
  PencilIcon, 
  TrashIcon,
  ClockIcon,
  InboxIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface ContactGroup {
  id: string;
  name: string;
}

interface GroupContact {
  contactGroup: ContactGroup;
}

interface ContactStats {
  SENT?: number;
  DELIVERED?: number;
  OPENED?: number;
  CLICKED?: number;
  BOUNCED?: number;
  FAILED?: number;
  PENDING?: number;
}

interface CampaignActivity {
  id: string;
  name: string;
  subject: string;
  sentAt: string;
  status: string;
}

interface Contact {
  id: string;
  email: string;
  additionalData?: Record<string, string | number | boolean | null>;
  groupContacts?: GroupContact[];
  stats?: ContactStats;
  createdAt: string | Date;
}

interface ContactDetailProps {
  readonly contact: Contact;
  readonly isOpen: boolean;
  readonly onCloseAction: () => void;
  readonly onDeleteAction: () => void;
}

export function ContactDetail({ contact, isOpen, onCloseAction, onDeleteAction }: ContactDetailProps) {
  const router = useRouter();
  const [campaignActivities, setCampaignActivities] = useState<CampaignActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  
  // Calculate contact stats
  const totalSent = (contact.stats?.SENT ?? 0) + (contact.stats?.DELIVERED ?? 0) + 
                   (contact.stats?.OPENED ?? 0) + (contact.stats?.CLICKED ?? 0);
  const totalOpened = (contact.stats?.OPENED ?? 0) + (contact.stats?.CLICKED ?? 0);
  const totalClicked = contact.stats?.CLICKED ?? 0;
  const totalBounced = contact.stats?.BOUNCED ?? 0;
  const totalFailed = contact.stats?.FAILED ?? 0;
  
  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
  const deliveryRate = totalSent > 0 ? ((totalSent - totalBounced - totalFailed) / totalSent) * 100 : 0;
  
  // Fetch campaign activity on component mount
  useEffect(() => {
    if (isOpen && contact.id) {
      fetchCampaignActivity();
    }
  }, [isOpen, contact.id]);
  
  async function fetchCampaignActivity() {
    setIsLoadingActivity(true);
    try {
      // For demo purposes, we'll use mock data
      setTimeout(() => {
        const mockActivities: CampaignActivity[] = [
          {
            id: "camp1",
            name: "Monthly Newsletter",
            subject: "Your June Newsletter",
            sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: "OPENED"
          },
          {
            id: "camp2",
            name: "Product Update",
            subject: "New Features Released",
            sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: "CLICKED"
          },
          {
            id: "camp3",
            name: "Special Offer",
            subject: "Limited Time Discount",
            sentAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: "DELIVERED"
          }
        ];
        setCampaignActivities(mockActivities);
        setIsLoadingActivity(false);
      }, 800);
    } catch (error) {
      console.error("Error fetching campaign activity:", error);
      setIsLoadingActivity(false);
    }
  }
  
  function getStatusBadge(status: string) {
    switch (status) {
      case 'OPENED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Opened
          </span>
        );
      case 'CLICKED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Clicked
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <InboxIcon className="h-3 w-3 mr-1" />
            Delivered
          </span>
        );
      case 'BOUNCED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="h-3 w-3 mr-1" />
            Bounced
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="h-3 w-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  }
  
  // Function to render content based on activity loading state
  const renderActivityContent = () => {
    if (isLoadingActivity) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((key) => (
            <div key={`skeleton-${key}`} className="bg-gray-100 h-16 animate-pulse rounded-md"></div>
          ))}
        </div>
      );
    }
    
    if (campaignActivities.length > 0) {
      return (
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
          {campaignActivities.map((activity) => (
            <div key={activity.id} className="p-4 bg-white hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="text-sm font-medium text-gray-900">{activity.name}</h5>
                  <p className="text-xs text-gray-500 mt-1">
                    Subject: {activity.subject}
                  </p>
                </div>
                {getStatusBadge(activity.status)}
              </div>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <ClockIcon className="h-3 w-3 mr-1" />
                {format(new Date(activity.sentAt), 'MMM d, yyyy')}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-sm text-gray-500">
          No campaign activity found for this contact
        </p>
      </div>
    );
  };
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 overflow-hidden z-50" onClose={onCloseAction}>
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div  className="fixed inset-0 bg-gray-500 transition-opacity" 
            style={{ backgroundColor: 'rgba(107, 114, 128, 0.7)' }} />
          </Transition.Child>
          
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
                  <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        Contact Details
                      </Dialog.Title>
                      <div className="ml-3 h-7 flex items-center">
                        <button
                          type="button"
                          className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                          onClick={onCloseAction}
                        >
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 px-4 sm:px-6">
                    <div className="py-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center">
                          {contact.additionalData?.name ? (
                            <span className="text-xl text-blue-800 font-medium">
                              {String(contact.additionalData.name).charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <UserIcon className="h-7 w-7 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-medium text-gray-900">
                            {contact.additionalData?.name ? String(contact.additionalData.name) : "No Name"}
                          </h2>
                          <div className="flex items-center text-gray-500 mt-1">
                            <EnvelopeIcon className="h-4 w-4 mr-1.5" />
                            <span>{contact.email}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Tab.Group>
                        <Tab.List className="flex space-x-8 border-b border-gray-200 mt-6">
                          <Tab className={({ selected }) => 
                            `py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                              selected 
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`
                          }>
                            Profile
                          </Tab>
                          <Tab className={({ selected }) => 
                            `py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                              selected 
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`
                          }>
                            Groups
                          </Tab>
                          <Tab className={({ selected }) => 
                            `py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                              selected 
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`
                          }>
                            Activity
                          </Tab>
                        </Tab.List>
                        
                        <Tab.Panels className="mt-4">
                          {/* Profile Panel */}
                          <Tab.Panel>
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                  Contact Information
                                </h3>
                                
                                <div className="bg-gray-50 rounded-md p-4 mb-4">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center text-sm text-gray-500">
                                      <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                                      Added on
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>
                                
                                {contact.additionalData && Object.entries(contact.additionalData).length > 0 ? (
                                  <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-200">
                                    {Object.entries(contact.additionalData).map(([key, value]) => (
                                      <div key={key} className="flex justify-between py-3 px-4">
                                        <span className="text-sm font-medium text-gray-900 capitalize">{key}</span>
                                        <span className="text-sm text-gray-700 break-all text-right">{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
                                    <UserIcon className="mx-auto h-10 w-10 text-gray-400" />
                                    <p className="mt-2 text-sm font-medium text-gray-900">No additional data</p>
                                    <p className="text-sm text-gray-500">
                                      Add details about this contact by editing their profile
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                                <h3 className="text-sm font-medium text-blue-800 mb-2">Email Deliverability</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-white rounded-md border border-blue-100">
                                    <div className="text-xs text-blue-600 uppercase font-medium mb-1">Open Rate</div>
                                    <div className="text-xl font-bold text-blue-800">{openRate.toFixed(1)}%</div>
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className="bg-blue-600 h-1.5 rounded-full" 
                                        style={{ width: `${openRate}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-white rounded-md border border-blue-100">
                                    <div className="text-xs text-blue-600 uppercase font-medium mb-1">Click Rate</div>
                                    <div className="text-xl font-bold text-blue-800">{clickRate.toFixed(1)}%</div>
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className="bg-green-600 h-1.5 rounded-full" 
                                        style={{ width: `${clickRate}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Tab.Panel>
                          
                          {/* Groups Panel */}
                          <Tab.Panel>
                            <div className="space-y-4">
                              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                Group Memberships
                              </h3>
                              
                              {contact.groupContacts && contact.groupContacts.length > 0 ? (
                                <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-200">
                                  {contact.groupContacts.map((gc) => (
                                    <div key={gc.contactGroup.id} className="py-3 px-4 flex justify-between items-center">
                                      <div className="flex items-center">
                                        <TagIcon className="h-5 w-5 text-blue-500 mr-2" />
                                        <span className="text-sm text-gray-900">{gc.contactGroup.name}</span>
                                      </div>
                                      <button
                                        type="button"
                                        className="text-sm text-red-600 hover:text-red-800"
                                        onClick={() => {
                                          // Implement remove from group functionality
                                        }}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                                  <TagIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                  <p className="font-medium text-gray-900">Not a member of any groups</p>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Add this contact to groups for better organization
                                  </p>
                                  <div className="mt-4">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => router.push(`/contacts/edit/${contact.id}`)}
                                    >
                                      Add to Groups
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 mt-6">
                                <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                                  <InformationCircleIcon className="h-5 w-5 mr-1.5 text-yellow-500" />
                                  Group Management
                                </h4>
                                <p className="text-sm text-yellow-700">
                                  Groups help you organize contacts and target specific audiences for your campaigns.
                                  Edit this contact to add or remove them from groups.
                                </p>
                              </div>
                            </div>
                          </Tab.Panel>
                          
                          {/* Activity Panel */}
                          <Tab.Panel>
                            <div className="space-y-4">
                              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                Email Activity
                              </h3>
                              
                              {totalSent > 0 ? (
                                <>
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div className="p-3 bg-gray-50 rounded-md text-center">
                                        <div className="text-xs text-gray-500 uppercase mb-1">Emails Sent</div>
                                        <div className="text-xl font-bold text-gray-900">{totalSent}</div>
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded-md text-center">
                                        <div className="text-xs text-gray-500 uppercase mb-1">Delivery Rate</div>
                                        <div className="text-xl font-bold text-gray-900">{deliveryRate.toFixed(1)}%</div>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                          <div className="h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
                                          <span className="text-sm font-medium">Opened</span>
                                        </div>
                                        <span className="text-sm">{totalOpened} ({openRate.toFixed(1)}%)</span>
                                      </div>
                                      
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                          <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                                          <span className="text-sm font-medium">Clicked</span>
                                        </div>
                                        <span className="text-sm">{totalClicked} ({clickRate.toFixed(1)}%)</span>
                                      </div>
                                      
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                          <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                                          <span className="text-sm font-medium">Bounced</span>
                                        </div>
                                        <span className="text-sm">{totalBounced}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <h4 className="text-sm font-medium text-gray-700 mt-6 mb-2">
                                    Recent Campaign Activity
                                  </h4>
                                  
                                  {renderActivityContent()}
                                </>
                              ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                                  <ClockIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                  <p className="font-medium text-gray-900">No email activity yet</p>
                                  <p className="mt-1 text-sm text-gray-500">
                                    This contact hasn&apos;t received any emails
                                  </p>
                                  <div className="mt-4">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => router.push('/campaigns/create')}
                                    >
                                      Create Campaign
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Tab.Panel>
                        </Tab.Panels>
                      </Tab.Group>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between space-x-3">
                      <Button
                        variant="outline-danger"
                        onClick={onDeleteAction}
                        icon={<TrashIcon className="h-4 w-4 mr-1.5" />}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          onCloseAction();
                          router.push(`/contacts/edit/${contact.id}`);
                        }}
                        icon={<PencilIcon className="h-4 w-4 mr-1.5" />}
                      >
                        Edit Contact
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}