// components/groups/GroupDetail.tsx
"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import Link from "next/link";

interface Contact {
  id: string;
  email: string;
  additionalData?: Record<string, unknown>;
}

interface GroupContact {
  contact: Contact;
}

interface ContactGroup {
  id: string;
  name: string;
  groupContacts: GroupContact[];
}

interface GroupDetailProps {
  readonly group: ContactGroup;
  readonly availableContacts: Contact[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onUpdateNameAction: (name: string) => Promise<boolean>; // Renamed to onUpdateNameAction
  readonly onAddContactAction: (contactId: string) => Promise<boolean>; // Renamed to onAddContactAction
  readonly onRemoveContactAction: (contactId: string) => Promise<boolean>; // Renamed to onRemoveContactAction
  readonly onDeleteGroupAction: () => Promise<boolean>; // Renamed to onDeleteGroupAction
}

export function GroupDetail({
  group,
  availableContacts,
  isLoading,
  error,
  onUpdateNameAction,
  onAddContactAction,
  onRemoveContactAction,
  onDeleteGroupAction
}: GroupDetailProps) {
  const [groupName, setGroupName] = useState(group.name);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle group name update
  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || groupName === group.name) return;
    
    setIsUpdatingName(true);
    setLocalError(null);
    
    try {
      const success = await onUpdateNameAction(groupName);
      if (!success) {
        setLocalError("Failed to update group name");
      }
    } catch (err) {
      console.error("Error in name update:", err);
      setLocalError("An unexpected error occurred");
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Handle adding contact to group
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) return;
    
    setIsAddingContact(true);
    setLocalError(null);
    
    try {
      const success = await onAddContactAction(selectedContactId);
      if (success) {
        setSelectedContactId("");
      } else {
        setLocalError("Failed to add contact to group");
      }
    } catch (err) {
      console.error("Error adding contact:", err);
      setLocalError("An unexpected error occurred");
    } finally {
      setIsAddingContact(false);
    }
  };

  // Render error message if any
  const errorMessage = error ?? localError; // Changed from || to ??

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Group: {group.name}</h1>
        <div className="flex gap-2">
          <Link href="/groups">
            <Button variant="warning">Back to Groups</Button>
          </Link>
          <Button 
            variant="danger" 
            onClick={onDeleteGroupAction}
            disabled={isLoading}
          >
            Delete Group
          </Button>
        </div>
      </div>
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {errorMessage}
        </div>
      )}
      
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Edit Group Name</h2>
          <form onSubmit={handleNameUpdate} className="flex gap-4 items-end mb-6">
            <div className="flex-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Group Name
              </label>
              <Input
                id="name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={isUpdatingName}
                required
              />
            </div>
            <Button 
              variant="success"
              type="submit"
              loading={isUpdatingName}
              disabled={!groupName.trim() || groupName === group.name}
            >
              Update Name
            </Button>
          </form>
          
          <h2 className="text-lg font-medium mt-6 mb-4">Contacts in this Group</h2>
          {group.groupContacts.length > 0 ? (
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
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.groupContacts.map((gc) => (
                    <tr key={gc.contact.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {gc.contact.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {gc.contact.additionalData && 
                          Object.entries(gc.contact.additionalData).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onRemoveContactAction(gc.contact.id)}
                          disabled={isLoading}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No contacts in this group yet</p>
            </div>
          )}
          
          {availableContacts.length > 0 && (
            <>
              <h2 className="text-lg font-medium mt-8 mb-4">Add Contacts to Group</h2>
              <form onSubmit={handleAddContact} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="contactId" className="block text-sm font-medium text-gray-700">
                    Select Contact
                  </label>
                  <select
                    id="contactId"
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    required
                    disabled={isAddingContact}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select contact</option>
                    {availableContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.email}
                      </option>
                    ))}
                  </select>
                </div>
                <Button 
                  type="submit" 
                  size="sm" 
                  loading={isAddingContact}
                  disabled={!selectedContactId}
                >
                  Add to Group
                </Button>
              </form>
            </>
          )}
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Group Management</h2>
              <div className="flex gap-2">
                <Link href="/contacts/import">
                  <Button variant="secondary">Import Contacts</Button>
                </Link>
                <Link href={`/contacts?groupId=${group.id}`}>
                  <Button
                  variant="info">View All Contacts</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}