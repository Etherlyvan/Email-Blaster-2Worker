// components/groups/GroupDetailsWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { GroupDetail } from "./GroupDetail";

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

interface GroupDetailsWrapperProps {
  readonly initialGroup: ContactGroup;
}

export function GroupDetailWrapper({ initialGroup }: GroupDetailsWrapperProps) {
  const router = useRouter();
  const [group, setGroup] = useState<ContactGroup>(initialGroup);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch available contacts (not in the group)
  useEffect(() => {
    async function fetchAvailableContacts() {
      setIsLoading(true);
      try {
        // Get all contacts
        const response = await axios.get('/api/contacts');
        const allContacts = response.data;
        
        // Filter out contacts already in the group
        const groupContactIds = new Set(group.groupContacts.map(gc => gc.contact.id));
        const filteredContacts = allContacts.filter(
          (contact: Contact) => !groupContactIds.has(contact.id)
        );
        
        setAvailableContacts(filteredContacts);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setError("Failed to load available contacts");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAvailableContacts();
  }, [group]);
  
  // Update group name
  const handleUpdateName = async (name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.put(`/api/groups/${group.id}`, { name });
      setGroup({ ...group, name });
      return true;
    } catch (err) {
      console.error("Error updating group name:", err);
      setError("Failed to update group name");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add contact to group
  const handleAddContact = async (contactId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post(`/api/groups/${group.id}/contacts`, { contactId });
      
      // Find the contact from available contacts
      const contactToAdd = availableContacts.find(c => c.id === contactId);
      if (contactToAdd) {
        // Update local state
        const updatedGroupContacts = [
          ...group.groupContacts,
          { contact: contactToAdd }
        ];
        
        setGroup({
          ...group,
          groupContacts: updatedGroupContacts
        });
        
        // Remove from available contacts
        setAvailableContacts(availableContacts.filter(c => c.id !== contactId));
      }
      
      return true;
    } catch (err) {
      console.error("Error adding contact to group:", err);
      setError("Failed to add contact to group");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove contact from group
  const handleRemoveContact = async (contactId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/groups/${group.id}/contacts/${contactId}`);
      
      // Find the contact from group
      const contactToRemove = group.groupContacts.find(gc => gc.contact.id === contactId)?.contact;
      
      // Update local state
      const updatedGroupContacts = group.groupContacts.filter(gc => gc.contact.id !== contactId);
      setGroup({
        ...group,
        groupContacts: updatedGroupContacts
      });
      
      // Add to available contacts if it exists
      if (contactToRemove) {
        setAvailableContacts([...availableContacts, contactToRemove]);
      }
      
      return true;
    } catch (err) {
      console.error("Error removing contact from group:", err);
      setError("Failed to remove contact from group");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete group
  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This will not delete the contacts.')) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/groups/${group.id}`);
      router.push('/groups');
      return true;
    } catch (err) {
      console.error("Error deleting group:", err);
      setError("Failed to delete group");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <GroupDetail
      group={group}
      availableContacts={availableContacts}
      isLoading={isLoading}
      error={error}
      onUpdateNameAction={handleUpdateName}      // Updated to onUpdateNameAction
      onAddContactAction={handleAddContact}      // Updated to onAddContactAction
      onRemoveContactAction={handleRemoveContact} // Updated to onRemoveContactAction
      onDeleteGroupAction={handleDeleteGroup}    // Updated to onDeleteGroupAction
    />
  );
}