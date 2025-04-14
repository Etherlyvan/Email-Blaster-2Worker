// components/contacts/ContactsFilter.tsx
"use client";

import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  TagIcon
} from '@heroicons/react/24/outline';

// Create a proper type for ContactGroup
interface ContactGroup {
  id: string;
  name: string;
}

interface ContactsFilterProps {
  readonly searchTerm: string;
  readonly onSearchChangeAction: (term: string) => void;
  readonly selectedGroupId: string | null;
  readonly onGroupChangeAction: (groupId: string | null) => void;
  readonly groups: readonly ContactGroup[];
  readonly tags: string[];
  readonly selectedTag: string | null;
  readonly onTagChangeAction: (tag: string | null) => void;
  readonly view: "list" | "cards";
  readonly onViewChangeAction: (view: "list" | "cards") => void;
}

export function ContactsFilter({
  searchTerm,
  onSearchChangeAction,
  selectedGroupId,
  onGroupChangeAction,
  groups,
  tags,
  selectedTag,
  onTagChangeAction,
  view,
  onViewChangeAction
}: ContactsFilterProps) {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search contacts..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => onSearchChangeAction(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            onClick={() => onSearchChangeAction("")}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <div className="flex space-x-2">
        <div className="relative">
          <select
            className="appearance-none pl-8 pr-10 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedGroupId ?? ""}
            onChange={(e) => onGroupChangeAction(e.target.value || null)}
          >
            <option value="">All Groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {tags.length > 0 && (
          <div className="relative">
            <select
              className="appearance-none pl-8 pr-10 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedTag ?? ""}
              onChange={(e) => onTagChangeAction(e.target.value || null)}
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <TagIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}
        
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            className={`relative inline-flex items-center px-3 py-2 rounded-l-md border ${
              view === "list" 
                ? "bg-blue-50 text-blue-600 border-blue-500 z-10" 
                : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => onViewChangeAction("list")}
          >
            <ListBulletIcon className="h-5 w-5" />
            <span className="sr-only">List view</span>
          </button>
          <button
            type="button"
            className={`relative inline-flex items-center px-3 py-2 rounded-r-md border ${
              view === "cards" 
                ? "bg-blue-50 text-blue-600 border-blue-500 z-10" 
                : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => onViewChangeAction("cards")}
          >
            <ViewColumnsIcon className="h-5 w-5" />
            <span className="sr-only">Card view</span>
          </button>
        </div>
      </div>
    </div>
  );
}