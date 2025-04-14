// components/senders/SenderList.tsx

import { useState } from "react";
import axios from "axios";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input"; // Add this import
import { VerificationCodeModal } from "./VerificationCodeModal";
import { BulkVerifyModal } from "./BulkVerifyModal";
import { 
  EnvelopeIcon, 
  TrashIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  // Remove InformationCircleIcon as it's unused
  UserIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

interface Sender {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  verificationStatus?: string;
  createdAt: string;
}

interface SenderListProps {
  readonly senders: readonly Sender[];
  readonly onAddAction: () => void;
  readonly onRefreshAction: () => void;
}

export function SenderList({ senders, onAddAction, onRefreshAction }: SenderListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showBulkVerifyModal, setShowBulkVerifyModal] = useState(false);
  const [selectedSender, setSelectedSender] = useState<Sender | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter senders by search term
  const filteredSenders = senders.filter(sender => 
    sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sender.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group verified and unverified senders
  const verifiedSenders = filteredSenders.filter(sender => sender.isVerified);
  const unverifiedSenders = filteredSenders.filter(sender => !sender.isVerified);
  
  const handleDelete = async (senderId: string) => {
    if (!confirm("Are you sure you want to delete this sender?")) {
      return;
    }
    
    setIsDeleting(senderId);
    
    try {
      const response = await axios.delete(`/api/senders/${senderId}`);
      
      if (response.data.brevoDeleteResult && !response.data.brevoDeleteResult.success) {
        // Show a more informative message about why deletion might fail on Brevo's side
        alert("The sender was removed from your account but could not be deleted from Brevo. This usually happens when the sender has been used in campaigns or has pending verification.");
      }
      
      onRefreshAction();
    } catch (error) {
      console.error("Failed to delete sender:", error);
      
      // More specific error message
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        alert("This sender cannot be deleted because it's being used in one or more campaigns.");
      } else {
        alert("Failed to delete sender. Please try again later.");
      }
    } finally {
      setIsDeleting(null);
    }
  };
  
  const handleVerify = async (sender: Sender) => {
    setIsVerifying(sender.id);
    
    try {
      // Request verification
      const response = await axios.post(`/api/senders/${sender.id}/verify`);
      
      if (response.data.success) {
        // If already verified, refresh the list
        if (response.data.message === "Sender is now verified") {
          alert("Good news! This sender is already verified.");
          onRefreshAction();
          return;
        }
        
        // Show the verification code modal
        setSelectedSender(sender);
        setShowVerificationModal(true);
      } else {
        alert(response.data.error || "Failed to verify sender. Please try again.");
      }
    } catch (error) {
      console.error("Failed to verify sender:", error);
      
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("Failed to verify sender. Please try again.");
      }
    } finally {
      setIsVerifying(null);
    }
  };
  
  const checkVerificationStatus = async (sender: Sender) => {
    if (isCheckingStatus === sender.id) return;
    
    setIsCheckingStatus(sender.id);
    try {
      console.log(`Checking verification status for sender: ${sender.email}`);
      const response = await axios.post(`/api/senders/${sender.id}/check`);
      console.log('Verification check response:', response.data);
      
      if (response.data.verified) {
        toast.success("Good news! Your sender is now verified.");
        onRefreshAction();
      } else if (response.data.exists === false) {
        toast.error("Sender not found in Brevo. Please recreate it.");
      } else {
        toast(response.data.message || "Still pending verification", {
          icon: '🔄'
        });
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      toast.error(
        axios.isAxiosError(error) 
          ? error.response?.data?.error || "Failed to check status"
          : "Network error"
      );
    } finally {
      setIsCheckingStatus(null);
    }
  };
  
  const handleVerificationComplete = () => {
    onRefreshAction();
  };
  
  // Helper function to get status badge
  const getStatusBadge = (sender: Sender) => {
    if (sender.isVerified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Verified
        </span>
      );
    }
    
    if (sender.verificationStatus === "VERIFICATION_EMAIL_SENT" || 
        sender.verificationStatus === "VERIFICATION_CODE_SENT") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          Pending Verification
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircleIcon className="h-4 w-4 mr-1" />
        Not Verified
      </span>
    );
  };
  
  // Render a single sender card
  const renderSenderCard = (sender: Sender) => (
    <Card key={sender.id} className="p-4">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="font-medium text-gray-900">{sender.name}</h4>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center">
              <EnvelopeIcon className="h-4 w-4 mr-1.5 text-gray-400" />
              {sender.email}
            </p>
          </div>
          <div>
            {getStatusBadge(sender)}
          </div>
        </div>
        
        {!sender.isVerified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3 mb-2">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Verification Required</p>
                <p className="text-xs text-yellow-700 mt-1">
                  This sender requires verification before it can be used. Check your email for a verification code.
                </p>
                <div className="mt-2 flex space-x-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleVerify(sender)}
                    loading={isVerifying === sender.id}
                  >
                    Verify Now
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => checkVerificationStatus(sender)}
                    loading={isCheckingStatus === sender.id}
                  >
                    Check Status
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Added on {new Date(sender.createdAt).toLocaleDateString()}
          </div>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleDelete(sender.id)}
            loading={isDeleting === sender.id}
            icon={<TrashIcon className="h-4 w-4" />}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
  
  if (senders.length === 0) {
    return (
      <Card className="text-center p-8">
        <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No senders added yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add a sender to use in your email campaigns. Senders need to be verified before use.
        </p>
        <div className="mt-6">
          <Button 
            variant="primary"
            onClick={onAddAction}
            icon={<PlusIcon className="h-5 w-5 mr-1.5" />}
          >
            Add Sender
          </Button>
        </div>
      </Card>
    );
  }
  
  // Add this return statement for the main component
  return (
    <div className="space-y-6">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search senders..."
            className="pl-10"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setSearchTerm('')}
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          {unverifiedSenders.length > 0 && (
            <Button
              variant="outline-primary"
              onClick={() => setShowBulkVerifyModal(true)}
              icon={<ArrowPathIcon className="h-5 w-5 mr-1.5" />}
            >
              Verify All ({unverifiedSenders.length})
            </Button>
          )}
          <Button
            variant="outline-secondary"
            onClick={onRefreshAction}
            icon={<ArrowPathIcon className="h-5 w-5 mr-1.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Unverified senders section */}
      {unverifiedSenders.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            Pending Verification ({unverifiedSenders.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unverifiedSenders.map(sender => renderSenderCard(sender))}
          </div>
        </div>
      )}
      
      {/* Verified senders section */}
      {verifiedSenders.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            Verified Senders ({verifiedSenders.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verifiedSenders.map(sender => renderSenderCard(sender))}
          </div>
        </div>
      )}
      
      {/* Verification modals */}
      {selectedSender && (
        <VerificationCodeModal
          isOpen={showVerificationModal}
          onCloseAction={() => {
            setShowVerificationModal(false);
            setSelectedSender(null);
          }}
          onVerifiedAction={handleVerificationComplete}
          senderId={selectedSender.id}
          senderEmail={selectedSender.email} // Add the missing senderEmail prop
        />
      )}
      
      <BulkVerifyModal
        isOpen={showBulkVerifyModal}
        onCloseAction={() => setShowBulkVerifyModal(false)}
        onVerifiedAction={handleVerificationComplete}
        unverifiedSenders={unverifiedSenders} // Change senderIds to unverifiedSenders
      />
    </div>
  );
}