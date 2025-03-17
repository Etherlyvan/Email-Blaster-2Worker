// components/contacts/ContactList.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "../ui/Button";
import { ContactGroup } from "../../types/group";

// Define an interface for the contact group in the groupContacts array
interface GroupContact {
  contactGroup: ContactGroup;
}

// Update the Contact interface to include groupContacts
interface Contact {
  id: string;
  email: string;
  additionalData?: Record<string, string | number | boolean | null>;
  groupContacts?: GroupContact[];
}

interface ContactListProps {
  readonly contacts: Contact[];
  readonly groups: ContactGroup[];
  readonly selectedGroupId?: string;
}

export function ContactList({ contacts, groups, selectedGroupId }: ContactListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  
  const filteredContacts = contacts.filter(contact => 
    contact.email.toLowerCase().includes(filter.toLowerCase())
  );
  
  async function handleDelete(contactId: string) {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return;
    }
    
    setIsDeleting(contactId);
    
    try {
      await axios.delete(`/api/contacts/${contactId}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete contact:", error);
      alert("Failed to delete contact. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setFilter("")}
            >
              &times;
            </button>
          )}
        </div>
        
        {groups.length > 0 && (
          <div className="flex-shrink-0">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedGroupId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  router.push(`/contacts?groupId=${value}`);
                } else {
                  router.push("/contacts");
                }
              }}
            >
              <option value="">All Contacts</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {filteredContacts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Additional Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Groups
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contact.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {contact.additionalData && Object.entries(contact.additionalData).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      {contact.groupContacts?.map((gc: GroupContact) => (
                        <span
                          key={gc.contactGroup.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {gc.contactGroup.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                      loading={isDeleting === contact.id}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-md shadow">
          {filter ? (
            <p className="text-gray-500">No contacts matching &quot;{filter}&quot;</p>
          ) : (
            <>
              <p className="text-gray-500">No contacts available</p>
              <div className="mt-4">
                <Link href="/contacts/create">
                  <Button>Add Contact</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}