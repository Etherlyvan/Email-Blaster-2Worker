// app/senders/page.tsx

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { SenderList } from "../../components/senders/SenderList";
import { AddSenderModal } from "../../components/senders/AddSenderModal";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PlusIcon } from '@heroicons/react/24/outline';

interface Sender {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  verificationStatus?: string;
  createdAt: string;
}

export default function SendersPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const fetchSenders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/senders');
      setSenders(response.data);
    } catch (err) {
      console.error("Error fetching senders:", err);
      setError("Failed to load senders");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSenders();
  }, []);
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 rounded w-40"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={`skeleton-${index}`} className="bg-gray-100 rounded-lg h-40"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Senders</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage verified sender identities for your email campaigns
            </p>
          </div>
          
          <Button 
            variant="primary"
            onClick={() => setShowAddModal(true)}
            icon={<PlusIcon className="h-5 w-5 mr-1.5" />}
          >
            Add Sender
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            {error}
            <Button 
              variant="outline-primary" 
              size="sm"
              className="ml-4"
              onClick={fetchSenders}
            >
              Try Again
            </Button>
          </div>
        )}
        
        <Card className="overflow-hidden">
          <div className="p-6">
            <SenderList 
              senders={senders} 
              onAddAction={() => setShowAddModal(true)}
              onRefreshAction={fetchSenders}
            />
          </div>
        </Card>
      </div>
      
      <AddSenderModal 
        isOpen={showAddModal}
        onCloseAction={() => setShowAddModal(false)}
        onAddedAction={fetchSenders}
      />
    </div>
  );
}