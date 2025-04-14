// components/groups/GroupList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ContactGroup } from "../../types/group";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  UsersIcon, 
  TrashIcon, 
  EyeIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <Input
              type="text"
              placeholder="Search groups..."
              className="pl-10 w-full"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setFilter("")}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        
        <Link href="/groups/create">
          <Button 
            variant="primary"
            icon={<PlusIcon className="h-5 w-5" />}
          >
            Create Group
          </Button>
        </Link>
      </div>
      
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card 
              key={group.id}
              className="hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">{group.name}</h2>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <UsersIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" />
                      <span>
                        {group._count?.groupContacts ?? 0} 
                        {group._count?.groupContacts === 1 ? ' contact' : ' contacts'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-full">
                    <UsersIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                  </div>
                </div>
                
                <div className="h-px bg-gray-200 my-4"></div>
                
                <div className="flex justify-between items-center mt-4">
                  <Link href={`/groups/${group.id}`}>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      icon={<EyeIcon className="h-4 w-4 mr-1" />}
                    >
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(group.id)}
                    loading={isDeleting === group.id}
                    icon={<TrashIcon className="h-4 w-4 mr-1" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-50">
            <UsersIcon className="h-8 w-8 text-blue-500" aria-hidden="true" />
          </div>
          
          {filter ? (
            <>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No matching groups found</h3>
              <p className="mt-1 text-sm text-gray-500">
                We couldn&apos;t find any groups matching &quot;{filter}&quot;
              </p>
              <div className="mt-6">
                <Button 
                  variant="outline-primary"
                  onClick={() => setFilter("")}
                >
                  Clear Search
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No groups available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first contact group.
              </p>
              <div className="mt-6">
                <Link href="/groups/create">
                  <Button 
                    variant="primary"
                    icon={<PlusIcon className="h-5 w-5 mr-1" />}
                  >
                    Create Group
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
      
      {filteredGroups.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Showing {filteredGroups.length} {filteredGroups.length === 1 ? 'group' : 'groups'}
          {filter && <span> matching &quot;{filter}&quot;</span>}
        </div>
      )}
    </div>
  );
}