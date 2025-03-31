// components/senders/VerificationNotification.tsx
'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "../ui/Button";
import { 
  ExclamationTriangleIcon, 
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Sender {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  verificationStatus?: string;
  createdAt: string;
}

export function VerificationNotification() {
  const [unverifiedCount, setUnverifiedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // Check local storage to see if notification was dismissed recently
    const dismissedUntil = localStorage.getItem('senderVerificationDismissedUntil');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
      setIsLoading(false);
      return;
    }
    
    async function checkUnverifiedSenders() {
      try {
        const response = await axios.get('/api/senders');
        const unverifiedSenders = response.data.filter((sender: Sender) => !sender.isVerified);
        setUnverifiedCount(unverifiedSenders.length);
      } catch (error) {
        console.error("Error checking senders:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkUnverifiedSenders();
  }, []);
  
  const handleDismiss = () => {
    // Dismiss for 24 hours
    const dismissUntil = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('senderVerificationDismissedUntil', dismissUntil.toString());
    setIsDismissed(true);
  };
  
  if (isLoading || isDismissed || unverifiedCount === 0) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            You have {unverifiedCount} unverified sender email{unverifiedCount !== 1 && 's'}.
            {' '}Verify them to ensure your emails are delivered successfully.
          </p>
          <div className="mt-2 flex">
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => router.push('/senders')}
              icon={<ArrowRightIcon className="h-4 w-4 mr-1.5" />}
            >
              Go to Senders
            </Button>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            type="button"
            className="bg-yellow-50 rounded-md inline-flex text-yellow-500 hover:text-yellow-600"
            onClick={handleDismiss}
          >
            <span className="sr-only">Dismiss</span>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}