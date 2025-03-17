// components/groups/GroupList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ContactGroup } from "../../types/group";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface GroupListProps {
  readonly groups: readonly ContactGroup[];
}

export function GroupList({ groups }: GroupListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  async function handleDelete(groupId: string) {
    if (!confirm("Are you sure you want to delete this group? This will not delete the contacts.")) {
      return;
    }
    
    setIsDeleting(groupId);
    
    try {
      await axios.delete(`/api/groups/${groupId}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Failed to delete group. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search groups..."
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
      
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
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
                    onClick={() => handleDelete(group.id)}
                    loading={isDeleting === group.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-md shadow">
          {filter ? (
            <p className="text-gray-500">No groups matching &quot;{filter}&quot;</p>
          ) : (
            <>
              <p className="text-gray-500">No groups available</p>
              <div className="mt-4">
                <Link href="/groups/create">
                  <Button>Create Group</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}