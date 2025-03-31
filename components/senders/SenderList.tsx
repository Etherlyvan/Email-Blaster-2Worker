// components/senders/SenderList.tsx

import { useState } from "react";
import axios from "axios";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
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
  InformationCircleIcon,
  UserIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

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
      const response = await axios.post(`/api/senders/${sender.id}/check`);
      
      if (response.data.verified) {
        alert("Good news! Your sender is now verified.");
        onRefreshAction();
      } else {
        alert("This sender is still pending verification. Please verify it by entering the code sent to your email.");
        handleVerify(sender);
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      alert("Failed to check verification status. Please try again.");
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
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Your Senders</h3>
        <div className="flex space-x-2">
          {unverifiedSenders.length > 0 && (
            <Button
              variant="outline-warning"
              onClick={() => setShowBulkVerifyModal(true)}
              icon={<ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />}
            >
              Verify All ({unverifiedSenders.length})
            </Button>
          )}
          <Button
            variant="outline-secondary"
            onClick={onRefreshAction}
            icon={<ArrowPathIcon className="h-4 w-4 mr-1.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={onAddAction}
            icon={<PlusIcon className="h-4 w-4 mr-1.5" />}
          >
            Add Sender
          </Button>
        </div>
      </div>
      
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search senders..."
          className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            onClick={() => setSearchTerm('')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Verified senders section */}
      {verifiedSenders.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1.5 text-green-500" />
            Verified Senders ({verifiedSenders.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verifiedSenders.map(renderSenderCard)}
          </div>
        </div>
      )}
      
      {/* Unverified senders section */}
      {unverifiedSenders.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1.5 text-yellow-500" />
            Pending Verification ({unverifiedSenders.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unverifiedSenders.map(renderSenderCard)}
          </div>
        </div>
      )}
      
      {filteredSenders.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No senders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            We couldn&apos;t find any senders matching &quot;{searchTerm}&quot;
          </p>
          <div className="mt-6">
            <Button 
              variant="outline-primary"
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-4 bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
        <h4 className="font-medium flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-1.5 text-blue-500" />
          About Sender Verification
        </h4>
        <p className="mt-1 ml-6">
          Senders need to be verified before they can be used in campaigns. After adding a sender,
          click the &quot;Verify&quot; button to receive a verification code by email. Enter this code
          to complete the verification process.
        </p>
        <div className="mt-2 ml-6 bg-white p-3 rounded border border-blue-200">
          <h5 className="font-medium text-blue-800">Troubleshooting Verification:</h5>
          <ul className="list-disc ml-5 mt-1 text-blue-700">
            <li>Check your spam/junk folder for the verification email</li>
            <li>Make sure the email address is valid and accessible</li>
            <li>Try clicking the &quot;Verify&quot; button again after a few minutes</li>
            <li>Ensure your Brevo API key has permission to manage senders</li>
          </ul>
        </div>
      </div>
      
      {/* Verification Code Modal */}
      {selectedSender && (
        <VerificationCodeModal
          isOpen={showVerificationModal}
          onCloseAction={() => setShowVerificationModal(false)}
          onVerifiedAction={handleVerificationComplete}
          senderId={selectedSender.id}
          senderEmail={selectedSender.email}
        />
      )}
      
      {/* Bulk Verification Modal */}
      <BulkVerifyModal
        isOpen={showBulkVerifyModal}
        onCloseAction={() => setShowBulkVerifyModal(false)}
        onVerifiedAction={onRefreshAction}
        unverifiedSenders={unverifiedSenders}
      />
    </div>
  );
}