// app/groups/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import axios from "axios";
import { useRouter } from "next/navigation";

interface ContactGroup {
  id: string;
  name: string;
  _count?: {
    groupContacts: number;
  };
}

// Define a proper error type for axios errors
interface ApiError {
  response?: {
    status?: number;
    data?: {
      error?: string;
    };
  };
  message: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const response = await axios.get("/api/groups");
      setGroups(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setError("Failed to load groups");
      setIsLoading(false);
    }
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm('Are you sure you want to delete this group? This will not delete the contacts.')) {
      return;
    }
    
    setIsDeleting(id);
    setError(null);
    
    try {
      console.log("Sending delete request for group ID:", id);
      await axios.delete(`/api/groups/${id}`);
      
      // Update the state to remove the deleted group
      setGroups(prevGroups => prevGroups.filter(group => group.id !== id));
      
      // Force a refresh to ensure everything is updated
      router.refresh();
    } catch (error: unknown) {
      console.error("Error deleting group:", error);
      
      // Cast to our defined error type
      const apiError = error as ApiError;
      
      if (apiError.response?.status === 404) {
        setError("Group not found or already deleted.");
      } else {
        setError(apiError.response?.data?.error ?? "Failed to delete group. Please try again.");
      }
    } finally {
      setIsDeleting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            {error}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Contact Groups</h1>
          <Link href="/groups/create">
            <Button>Create Group</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">{group.name}</h2>
                <p className="mt-2 text-sm text-gray-500">
                  {group._count?.groupContacts ?? 0} contacts
                </p>
                <div className="mt-4 flex justify-between">
                  <Link href={`/groups/${group.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    loading={isDeleting === group.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {groups.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <div className="p-6 text-center">
                <h2 className="text-lg font-medium text-gray-900">No contact groups yet</h2>
                <p className="mt-2 text-sm text-gray-500">Get started by creating a new group.</p>
                <div className="mt-6">
                  <Link href="/groups/create">
                    <Button>Create Group</Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}