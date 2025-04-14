// components/contacts/ContactList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ContactDetail } from "./ContactDetail";
import { 
  UserIcon, 
  EnvelopeIcon, 
  TrashIcon, 
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Define proper types instead of using 'any'
interface ContactStats {
  SENT?: number;
  DELIVERED?: number;
  OPENED?: number;
  CLICKED?: number;
  BOUNCED?: number;
  FAILED?: number;
}

interface ContactGroup {
  id: string;
  name: string;
}

interface GroupContact {
  contactGroup: ContactGroup;
}

interface Contact {
  id: string;
  email: string;
  additionalData?: Record<string, string | number | boolean | null>;
  groupContacts?: GroupContact[];
  stats?: ContactStats;
  createdAt: string | Date; // Added createdAt to match ContactDetail requirements
}

interface ContactListProps {
  readonly contacts: Contact[];
  readonly view: "list" | "cards";
  readonly onRefreshAction: () => void;
}

export function ContactList({ contacts, view, onRefreshAction }: ContactListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  async function handleDelete(contactId: string) {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return;
    }
    
    setIsDeleting(contactId);
    
    try {
      await axios.delete(`/api/contacts/${contactId}`);
      onRefreshAction(); // Changed from onRefresh to onRefreshAction
    } catch (error) {
      console.error("Failed to delete contact:", error);
      alert("Failed to delete contact. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  }
  
  function handleViewContact(contact: Contact) {
    setSelectedContact(contact);
    setShowDetailModal(true);
  }
  
  if (view === "cards") {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {contacts.map((contact) => (
            <Card key={contact.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        {contact.additionalData?.name ?? "No Name"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 break-all">{contact.email}</p>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleViewContact(contact)}
                      className="text-gray-400 hover:text-gray-600"
                      title="View details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {contact.additionalData && Object.keys(contact.additionalData).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Details</h4>
                    <div className="space-y-1.5">
                      {Object.entries(contact.additionalData)
                        .filter(([key]) => key !== 'name')
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-xs text-gray-500">{key}:</span>
                            <span className="text-xs font-medium text-gray-900 truncate max-w-[70%]">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      {Object.keys(contact.additionalData).length > 4 && (
                        <button
                          className="text-xs text-blue-600 cursor-pointer hover:text-blue-800"
                          onClick={() => handleViewContact(contact)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleViewContact(contact);
                            }
                          }}
                        >
                          + {Object.keys(contact.additionalData).length - 4} more fields
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {contact.groupContacts?.map((gc) => (
                      <span
                        key={gc.contactGroup.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {gc.contactGroup.name}
                      </span>
                    ))}
                    {contact.groupContacts?.length === 0 && (
                      <span className="text-xs text-gray-500 italic">No groups</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    icon={<PencilIcon className="h-4 w-4 mr-1" />}
                    onClick={() => router.push(`/contacts/edit/${contact.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    icon={<TrashIcon className="h-4 w-4 mr-1" />}
                    onClick={() => handleDelete(contact.id)}
                    loading={isDeleting === contact.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {selectedContact && (
          <ContactDetail 
            contact={selectedContact} 
            isOpen={showDetailModal} 
            onCloseAction={() => setShowDetailModal(false)}
            onDeleteAction={() => {
              setShowDetailModal(false);
              handleDelete(selectedContact.id);
            }}
          />
        )}
      </>
    );
  }
  
  return (
    <>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Groups
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stats
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => {
              // Calculate contact stats
              const totalSent = (contact.stats?.SENT ?? 0) + (contact.stats?.DELIVERED ?? 0) + 
                               (contact.stats?.OPENED ?? 0) + (contact.stats?.CLICKED ?? 0);
              const totalOpened = (contact.stats?.OPENED ?? 0) + (contact.stats?.CLICKED ?? 0);
              const totalClicked = contact.stats?.CLICKED ?? 0;
              
              return (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {contact.additionalData?.name ? (
                          <span className="text-blue-800 font-medium">
                            {String(contact.additionalData.name).charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {contact.additionalData?.name ?? "No Name"}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {contact.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {contact.additionalData ? (
                      <div className="text-sm text-gray-900 max-w-xs">
                        {Object.entries(contact.additionalData)
                          .filter(([key]) => key !== 'name')
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <div key={key} className="truncate">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        {Object.keys(contact.additionalData).filter(key => key !== 'name').length > 3 && (
                          <button 
                            onClick={() => handleViewContact(contact)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleViewContact(contact);
                              }
                            }}
                          >
                            + {Object.keys(contact.additionalData).filter(key => key !== 'name').length - 3} more fields
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">No additional data</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {contact.groupContacts?.map((gc) => (
                        <span
                          key={gc.contactGroup.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {gc.contactGroup.name}
                        </span>
                      ))}
                      {contact.groupContacts?.length === 0 && (
                        <span className="text-sm text-gray-500 italic">No groups</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {totalSent > 0 ? (
                      <div className="text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">Sent:</span>
                          <span className="font-medium">{totalSent}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">Opened:</span>
                          <span className="font-medium">
                            {totalOpened} 
                            <span className="text-xs text-gray-500 ml-1">
                              ({totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0}%)
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">Clicked:</span>
                          <span className="font-medium">
                            {totalClicked}
                            <span className="text-xs text-gray-500 ml-1">
                              ({totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0}%)
                            </span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">No email activity</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        icon={<EyeIcon className="h-4 w-4" />}
                        onClick={() => handleViewContact(contact)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        icon={<PencilIcon className="h-4 w-4" />}
                        onClick={() => router.push(`/contacts/edit/${contact.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        icon={<TrashIcon className="h-4 w-4" />}
                        onClick={() => handleDelete(contact.id)}
                        loading={isDeleting === contact.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Contact Detail Popup */}
      {selectedContact && (
        <ContactDetail 
          contact={selectedContact} 
          isOpen={showDetailModal} 
          onCloseAction={() => setShowDetailModal(false)}
          onDeleteAction={() => {
            setShowDetailModal(false);
            handleDelete(selectedContact.id);
          }}
        />
      )}
    </>
  );
}