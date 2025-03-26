// components/contacts/ContactDetail.tsx
"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
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
  ChartBarIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

// Define proper types instead of using 'any'
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
  const [activeTab, setActiveTab] = useState<'details' | 'groups' | 'activity'>('details');
  
  // Calculate contact stats
  const totalSent = (contact.stats?.SENT || 0) + (contact.stats?.DELIVERED || 0) + 
                   (contact.stats?.OPENED || 0) + (contact.stats?.CLICKED || 0);
  const totalOpened = (contact.stats?.OPENED || 0) + (contact.stats?.CLICKED || 0);
  const totalClicked = contact.stats?.CLICKED || 0;
  
  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
  
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
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                      
                      <div className="mt-6 border-b border-gray-200">
                        <div className="flex space-x-8">
                          <button
                            className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                              activeTab === 'details'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => setActiveTab('details')}
                          >
                            Details
                          </button>
                          <button
                            className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                              activeTab === 'groups'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => setActiveTab('groups')}
                          >
                            Groups
                          </button>
                          <button
                            className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                              activeTab === 'activity'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => setActiveTab('activity')}
                          >
                            Activity
                          </button>
                        </div>
                      </div>
                      
                      {activeTab === 'details' && (
                        <div className="py-4">
                          <div className="mt-2">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                              Contact Information
                            </h3>
                            
                            <div className="bg-gray-50 rounded-md p-4 mb-4">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Created</span>
                                <span className="text-sm text-gray-900">
                                  {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                            
                            {contact.additionalData && Object.entries(contact.additionalData).length > 0 ? (
                              <div className="space-y-3">
                                {Object.entries(contact.additionalData).map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <span className="text-sm font-medium text-gray-900 capitalize">{key}</span>
                                    <span className="text-sm text-gray-700 break-all text-right">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                No additional data available
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {activeTab === 'groups' && (
                        <div className="py-4">
                          <div className="mt-2">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                              Group Memberships
                            </h3>
                            
                            {contact.groupContacts && contact.groupContacts.length > 0 ? (
                              <ul className="divide-y divide-gray-200">
                                {contact.groupContacts.map((gc) => (
                                  <li key={gc.contactGroup.id} className="py-3 flex justify-between items-center">
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
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <TagIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                <p>Not a member of any groups</p>
                                <p className="mt-1 text-sm">
                                  Add this contact to groups for better organization
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {activeTab === 'activity' && (
                        <div className="py-4">
                          <div className="mt-2">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                              Email Activity
                            </h3>
                            
                            {totalSent > 0 ? (
                              <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                      <div className="text-lg font-semibold text-gray-900">{totalSent}</div>
                                      <div className="text-xs text-gray-500">Emails Sent</div>
                                    </div>
                                    <div>
                                      <div className="text-lg font-semibold text-gray-900">
                                        {openRate.toFixed(0)}%
                                      </div>
                                      <div className="text-xs text-gray-500">Open Rate</div>
                                    </div>
                                    <div>
                                      <div className="text-lg font-semibold text-gray-900">
                                        {clickRate.toFixed(0)}%
                                      </div>
                                      <div className="text-xs text-gray-500">Click Rate</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                      <InboxIcon className="h-5 w-5 text-blue-500 mr-2" />
                                      <span className="text-sm font-medium">Received</span>
                                    </div>
                                    <span className="text-sm text-gray-700">{totalSent}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                      <EnvelopeIcon className="h-5 w-5 text-green-500 mr-2" />
                                      <span className="text-sm font-medium">Opened</span>
                                    </div>
                                    <span className="text-sm text-gray-700">{totalOpened}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                      <ChartBarIcon className="h-5 w-5 text-purple-500 mr-2" />
                                      <span className="text-sm font-medium">Clicked</span>
                                    </div>
                                    <span className="text-sm text-gray-700">{totalClicked}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <ClockIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                <p>No email activity yet</p>
                                <p className="mt-1 text-sm">
                                  This contact hasn&apos;t received any emails
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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