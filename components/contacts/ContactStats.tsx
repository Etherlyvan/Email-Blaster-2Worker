// components/contacts/ContactStats.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { 
  UserGroupIcon, 
  EnvelopeIcon, 
  EnvelopeOpenIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Define a proper interface for the contact stats
interface ContactWithStats {
  id: string;
  stats?: Record<string, number>;
}

interface ContactStatsProps {
  readonly contacts: readonly ContactWithStats[];
}

export function ContactStats({ contacts }: ContactStatsProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }
  
  // Calculate stats
  const totalContacts = contacts.length;
  
  // Calculate email stats
  let totalSent = 0;
  let totalOpened = 0;
  
  contacts.forEach(contact => {
    if (contact.stats) {
      totalSent += (contact.stats.SENT || 0) + (contact.stats.DELIVERED || 0) + 
                   (contact.stats.OPENED || 0) + (contact.stats.CLICKED || 0);
      totalOpened += (contact.stats.OPENED || 0) + (contact.stats.CLICKED || 0);
    }
  });
  
  // Calculate open rate
  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  
  // Count contacts with email activity
  const contactsWithActivity = contacts.filter(contact => 
    contact.stats && Object.values(contact.stats).some(value => value > 0)
  ).length;
  
  const engagementRate = totalContacts > 0 ? (contactsWithActivity / totalContacts) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <div className="p-5 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-3">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{totalContacts}</h3>
          <p className="text-sm text-gray-500">Total Contacts</p>
        </div>
      </Card>
      
      <Card>
        <div className="p-5 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-3">
            <EnvelopeIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{totalSent}</h3>
          <p className="text-sm text-gray-500">Emails Sent</p>
        </div>
      </Card>
      
      <Card>
        <div className="p-5 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-3">
            <EnvelopeOpenIcon className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{openRate.toFixed(1)}%</h3>
          <p className="text-sm text-gray-500">Open Rate</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-purple-600 h-1.5 rounded-full" 
              style={{ width: `${openRate}%` }}
            ></div>
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="p-5 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full mb-3">
            <ChartBarIcon className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{engagementRate.toFixed(1)}%</h3>
          <p className="text-sm text-gray-500">Engagement Rate</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-amber-600 h-1.5 rounded-full" 
              style={{ width: `${engagementRate}%` }}
            ></div>
          </div>
        </div>
      </Card>
    </div>
  );
}