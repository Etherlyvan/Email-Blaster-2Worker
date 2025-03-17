// app/contacts/import/page.tsx
"use client"; 

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ContactImport } from "../../../components/contacts/ContactImport";
import { Card } from "../../../components/ui/Card";
import { ContactGroup } from "../../../types/group";
import { Button } from "../../../components/ui/Button"; // Import Button component

// Define the interface for the contact data structure
interface ContactWithAdditionalData {
  email: string;
  additionalData: Record<string, string | number | boolean | null>;
}

export default function ImportContactsPage() {
  const router = useRouter();
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch contact groups on component mount
  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await axios.get("/api/groups");
        setContactGroups(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch groups:", err);
        setError("Failed to load contact groups. Please try again later.");
        setIsLoading(false);
      }
    }
    
    fetchGroups();
  }, []); // Empty dependency array to run only on mount
  
  async function handleImport(contacts: ContactWithAdditionalData[], groupIds: string[]) {
    try {
      await axios.post("/api/contacts/import", { contacts, groupIds });
      router.push("/contacts");
      router.refresh();
    } catch (error) {
      console.error("Error importing contacts:", error);
      setError("Failed to import contacts. Please try again.");
    }
  }

  // Handle navigation to create group page
  const handleCreateGroupClick = () => {
    router.push("/groups/create");
  };
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Import Contacts</h1>
      
      <Card>
        <div className="p-6">
          {contactGroups.length > 0 ? (
            <ContactImport contactGroups={contactGroups} onImportAction={handleImport} />
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900">No contact groups available</h3>
              <p className="mt-1 text-sm text-gray-500">
                You need to create at least one contact group before importing contacts.
              </p>
              <div className="mt-6">
                {/* Use the client-side handler instead of a direct Link with onClick */}
                <Button 
                  onClick={handleCreateGroupClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Group
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}