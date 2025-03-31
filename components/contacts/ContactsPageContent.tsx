// components/contacts/ContactsPageContent.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ContactList } from "./ContactList";
import { ContactStats } from "./ContactStats";
import { ContactsFilter } from "./ContactsFilter";
import { Pagination } from "../ui/Pagination";
import { 
  PlusIcon, 
  ArrowUpTrayIcon, 
  ArrowPathIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Define proper types for contacts and groups
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
  groupContacts: GroupContact[];
  stats?: Record<string, number>;
  createdAt: string | Date;
}

interface ContactsPageContentProps {
  readonly contacts: Contact[];
  readonly groups: ContactGroup[];
}

export function ContactsPageContent({ contacts, groups }: ContactsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    searchParams?.get("groupId")
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "cards">("list");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get current page from URL or default to 1
  const currentPage = searchParams?.get("page") 
    ? parseInt(searchParams.get("page") ?? "1", 10) 
    : 1;
  
  const pageSize = 10; // Number of contacts per page
  
  // Extract all unique tags from contacts' additionalData
  const allTags = new Set<string>();
  contacts.forEach(contact => {
    if (contact.additionalData) {
      Object.keys(contact.additionalData).forEach(tagKey => allTags.add(tagKey));
    }
  });
  
  // Filter contacts based on search, group, and tag
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Filter by search term (email or any additionalData value)
      const matchesSearch = !searchTerm || 
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.additionalData && 
          Object.entries(contact.additionalData).some(([, value]) => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          ));
      
      // Filter by group
      const matchesGroup = !selectedGroupId || 
        contact.groupContacts.some((gc: GroupContact) => gc.contactGroup.id === selectedGroupId);
      
      // Filter by tag (additionalData key)
      const matchesTag = !tagFilter || 
        (contact.additionalData && tagFilter in contact.additionalData);
      
      return matchesSearch && matchesGroup && matchesTag;
    });
  }, [contacts, searchTerm, selectedGroupId, tagFilter]);
  
  // Apply pagination
  const totalItems = filteredContacts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Get current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredContacts.slice(startIndex, startIndex + pageSize);
  }, [filteredContacts, currentPage, pageSize]);
  
  // Handle group selection change
  useEffect(() => {
    if (selectedGroupId) {
      router.push(`/contacts?groupId=${selectedGroupId}`);
    } else {
      router.push("/contacts");
    }
  }, [selectedGroupId, router]);
  
  // Simulate refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      router.refresh();
      setIsRefreshing(false);
    }, 500);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your contacts and organize them into groups
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline-secondary"
            onClick={handleRefresh}
            loading={isRefreshing}
            icon={<ArrowPathIcon className="h-5 w-5 mr-1.5" />}
          >
            Refresh
          </Button>
          
          <Link href="/contacts/import">
            <Button 
              variant="secondary"
              icon={<ArrowUpTrayIcon className="h-5 w-5 mr-1.5" />}
            >
              Import
            </Button>
          </Link>
          
          <Link href="/contacts/create">
            <Button 
              variant="primary"
              icon={<PlusIcon className="h-5 w-5 mr-1.5" />}
            >
              Add Contact
            </Button>
          </Link>
        </div>
      </div>
      
      <ContactStats contacts={contacts} />
      
      <Card className="overflow-hidden">
        <div className="p-6">
          <ContactsFilter
            searchTerm={searchTerm}
            onSearchChangeAction={setSearchTerm}
            selectedGroupId={selectedGroupId}
            onGroupChangeAction={setSelectedGroupId}
            groups={groups}
            tags={Array.from(allTags)}
            selectedTag={tagFilter}
            onTagChangeAction={setTagFilter}
            view={view}
            onViewChangeAction={setView}
          />
          
          {currentItems.length > 0 ? (
            <>
              <ContactList 
                contacts={currentItems} 
                view={view}
                onRefreshAction={handleRefresh}
              />
              
              <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-500 flex justify-between items-center">
                <div>
                  Showing {Math.min(totalItems, (currentPage - 1) * pageSize + 1)} to {Math.min(totalItems, currentPage * pageSize)} of {totalItems} contacts
                </div>
              </div>
              
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="/contacts"
                queryParams={{
                  groupId: selectedGroupId ?? undefined
                }}
              />
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg mt-6">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedGroupId || tagFilter
                  ? "Try adjusting your filters to find what you're looking for."
                  : "Get started by adding your first contact."
                }
              </p>
              
              <div className="mt-6 flex justify-center gap-3">
                {(searchTerm || selectedGroupId || tagFilter) && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedGroupId(null);
                      setTagFilter(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                
                {!searchTerm && !selectedGroupId && !tagFilter && (
                  <>
                    <Link href="/contacts/import">
                      <Button variant="outline-primary">Import Contacts</Button>
                    </Link>
                    <Link href="/contacts/create">
                      <Button variant="primary">Add Contact</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}