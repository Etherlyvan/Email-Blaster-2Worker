// components/campaigns/SenderSelector.tsx

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../ui/Button";
import { 
  UserIcon, 
  PlusIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface Sender {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

interface SenderSelectorProps {
  readonly selectedSenderId: string | null;
  readonly onSelectSender: (sender: { id: string; name: string; email: string }) => void;
}

export function SenderSelector({ selectedSenderId, onSelectSender }: SenderSelectorProps) {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchSenders() {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/senders');
        // Only show verified senders
        const verifiedSenders = response.data.filter((sender: Sender) => sender.isVerified);
        setSenders(verifiedSenders);
        setError(null);
      } catch (err) {
        console.error("Error fetching senders:", err);
        setError("Failed to load verified senders");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSenders();
  }, []);
  
  const handleSelectSender = (sender: Sender) => {
    onSelectSender({
      id: sender.id,
      name: sender.name,
      email: sender.email
    });
  };
  
  if (isLoading) {
    return (
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800">
        {error}
      </div>
    );
  }
  
  if (senders.length === 0) {
    return (
      <div className="p-4 border border-yellow-200 rounded-md bg-yellow-50">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
          <div>
            <p className="text-sm font-medium text-yellow-800">No verified senders available</p>
            <p className="text-xs text-yellow-700 mt-1">
              You need to verify at least one sender email address before sending campaigns.
            </p>
            <Button
              variant="outline-warning"
              size="sm"
              className="mt-3"
              onClick={() => window.open('/senders', '_blank')}
              icon={<PlusIcon className="h-4 w-4 mr-1.5" />}
            >
              Add & Verify Sender
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Select a Verified Sender</h3>
      <div className="space-y-2">
        {senders.map(sender => (
          <div
            key={sender.id}
            className={`p-3 border rounded-md cursor-pointer transition-colors ${
              selectedSenderId === sender.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleSelectSender(sender)}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{sender.name}</p>
                <p className="text-xs text-gray-500">{sender.email}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}