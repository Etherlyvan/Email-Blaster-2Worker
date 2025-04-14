// components/senders/BulkVerifyModal.tsx

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import { Button } from "../ui/Button";
import { 
  XMarkIcon, 
  EnvelopeIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

interface Sender {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  verificationStatus?: string;
}

interface BulkVerifyModalProps {
  readonly isOpen: boolean;
  readonly onCloseAction: () => void;
  readonly onVerifiedAction: () => void;
  readonly unverifiedSenders: readonly Sender[];
}

export function BulkVerifyModal({ 
  isOpen, 
  onCloseAction, 
  onVerifiedAction,
  unverifiedSenders
}: BulkVerifyModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [results, setResults] = useState<Record<string, {
    status: 'pending' | 'success' | 'error';
    message?: string;
  }>>({});
  
  // Initialize results
  useEffect(() => {
    if (isOpen) {
      const initialResults: Record<string, { status: 'pending' | 'success' | 'error'; message?: string }> = {};
      unverifiedSenders.forEach(sender => {
        initialResults[sender.id] = { status: 'pending' };
      });
      setResults(initialResults);
    }
  }, [isOpen, unverifiedSenders]);
  
  const handleSendAllVerifications = async () => {
    setIsProcessing(true);
    
    // Process senders one by one
    for (const sender of unverifiedSenders) {
      try {
        // Update status to show we're processing this sender
        setResults(prev => ({
          ...prev,
          [sender.id]: { 
            status: 'pending',
            message: 'Sending verification email...'
          }
        }));
        
        // Request verification
        const response = await axios.post(`/api/senders/${sender.id}/verify`);
        
        if (response.data.success) {
          setResults(prev => ({
            ...prev,
            [sender.id]: { 
              status: 'success',
              message: response.data.message || 'Verification email sent successfully'
            }
          }));
        } else {
          setResults(prev => ({
            ...prev,
            [sender.id]: { 
              status: 'error',
              message: response.data.error || 'Failed to send verification email'
            }
          }));
        }
      } catch (error) {
        console.error(`Error verifying sender ${sender.email}:`, error);
        
        setResults(prev => ({
          ...prev,
          [sender.id]: { 
            status: 'error',
            message: 'An error occurred while sending verification email'
          }
        }));
      }
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsProcessing(false);
  };
  
  const handleCheckAllStatuses = async () => {
    setIsCheckingAll(true);
    
    let anyVerified = false;
    
    // Process senders one by one
    for (const sender of unverifiedSenders) {
      try {
        // Update status to show we're checking this sender
        setResults(prev => ({
          ...prev,
          [sender.id]: { 
            status: 'pending',
            message: 'Checking verification status...'
          }
        }));
        
        // Check verification status
        const response = await axios.post(`/api/senders/${sender.id}/check`);
        
        if (response.data.verified) {
          setResults(prev => ({
            ...prev,
            [sender.id]: { 
              status: 'success',
              message: 'Sender is now verified!'
            }
          }));
          anyVerified = true;
        } else {
          setResults(prev => ({
            ...prev,
            [sender.id]: { 
              status: 'pending',
              message: 'Still pending verification'
            }
          }));
        }
      } catch (error) {
        console.error(`Error checking sender ${sender.email}:`, error);
        
        setResults(prev => ({
          ...prev,
          [sender.id]: { 
            status: 'error',
            message: 'Error checking verification status'
          }
        }));
      }
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsCheckingAll(false);
    
    // If any sender was verified, refresh the list
    if (anyVerified) {
      setTimeout(() => {
        onVerifiedAction();
      }, 1000);
    }
  };
  
  const openBrevoSenders = () => {
    window.open('https://app.brevo.com/senders', '_blank');
  };
  
  // Count successful verifications
  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  const errorCount = Object.values(results).filter(r => r.status === 'error').length;
  const pendingCount = Object.values(results).filter(r => r.status === 'pending').length;
  
  // Get status icon for a sender
  const getStatusIcon = (senderId: string) => {
    const result = results[senderId];
    if (!result) {
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>;
    }
    
    if (result.status === 'success') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (result.status === 'error') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    } else {
      return (
        <div className={`h-5 w-5 rounded-full border-2 border-gray-300 ${isProcessing || isCheckingAll ? 'border-t-blue-500 animate-spin' : ''}`}></div>
      );
    }
  };
  
  // Get status text color
  const getStatusTextColor = (result: { status: 'pending' | 'success' | 'error'; message?: string }) => {
    if (result.status === 'success') {
      return 'text-green-600';
    } else if (result.status === 'error') {
      return 'text-red-600';
    } else {
      return 'text-gray-500';
    }
  };
  
  return (
    <Dialog
      open={isOpen}
      onClose={onCloseAction}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
        
        <span
          className="inline-block h-screen align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>
        
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-500" />
              Bulk Verify Senders
            </h3>
            
            <button
              onClick={onCloseAction}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              disabled={isProcessing}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-4">
              Send verification emails to all your unverified senders at once. Each sender will
              receive an email with a verification link.
            </p>
            
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
              <h4 className="font-medium flex items-center">
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Verification Instructions
              </h4>
              <p className="mt-2 text-sm">
                After sending verification emails:
              </p>
              <ol className="mt-1 ml-5 text-sm list-decimal">
                <li>Check each email address&apos;s inbox (including spam folder)</li>
                <li>Open the verification email from Brevo</li>
                <li>Click the verification link in each email</li>
                <li>Return here and click &quot;Check All Statuses&quot;</li>
              </ol>
              <div className="mt-3">
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={openBrevoSenders}
                  icon={<ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />}
                >
                  Open Brevo Dashboard
                </Button>
              </div>
            </div>
            
            <div className="mt-4 bg-gray-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Verification Status</h4>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {unverifiedSenders.map(sender => (
                  <div key={sender.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {getStatusIcon(sender.id)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sender.name}</p>
                        <p className="text-xs text-gray-500">{sender.email}</p>
                      </div>
                    </div>
                    <div className="text-xs">
                      {results[sender.id]?.message && (
                        <span className={getStatusTextColor(results[sender.id])}>
                          {results[sender.id].message}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {unverifiedSenders.length > 0 && (
                <div className="mt-4 flex justify-between items-center text-sm">
                  <div className="text-gray-500">
                    Total: {unverifiedSenders.length}
                  </div>
                  <div className="flex space-x-4">
                    <span className="text-green-600">{successCount} Verified</span>
                    <span className="text-red-600">{errorCount} Failed</span>
                    <span className="text-gray-500">{pendingCount} Pending</span>
                  </div>
                </div>
              )}
              
              {unverifiedSenders.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  All your senders are already verified.
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline-secondary"
              onClick={onCloseAction}
              disabled={isProcessing || isCheckingAll}
            >
              {successCount > 0 ? 'Done' : 'Cancel'}
            </Button>
            
            {unverifiedSenders.length > 0 && (
              <>
                <Button
                  type="button"
                  onClick={handleCheckAllStatuses}
                  loading={isCheckingAll}
                  disabled={isProcessing || isCheckingAll}
                  variant="outline-primary"
                  icon={<ArrowPathIcon className="h-4 w-4 mr-1.5" />}
                >
                  Check All Statuses
                </Button>
                
                <Button
                  type="button"
                  onClick={handleSendAllVerifications}
                  loading={isProcessing}
                  disabled={isProcessing || isCheckingAll || unverifiedSenders.length === 0}
                  variant="primary"
                  icon={<EnvelopeIcon className="h-4 w-4 mr-1.5" />}
                >
                  {isProcessing ? 'Sending...' : 'Send All Verification Emails'}
                </Button>
              </>
            )}
            
            {successCount > 0 && !isProcessing && !isCheckingAll && (
              <Button
                type="button"
                onClick={onVerifiedAction}
                variant="success"
                icon={<CheckCircleIcon className="h-4 w-4 mr-1.5" />}
              >
                Refresh Sender List
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}