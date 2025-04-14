// components/senders/VerificationCodeModal.tsx

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { 
  XMarkIcon, 
  FingerPrintIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface VerificationCodeModalProps {
  readonly isOpen: boolean;
  readonly onCloseAction: () => void;
  readonly onVerifiedAction: () => void;
  readonly senderId: string;
  readonly senderEmail: string;
}

export function VerificationCodeModal({ 
  isOpen, 
  onCloseAction, 
  onVerifiedAction,
  senderId
}: VerificationCodeModalProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const handleResendCode = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      setIsResending(true);
      
      const response = await axios.post(`/api/senders/${senderId}/verify`, null, {
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data.success) {
        setSuccessMessage(response.data.message || "New verification code sent");
      } else {
        // Handle different error cases
        if (response.data.error?.includes("No active Brevo API")) {
          setError("No active Brevo API key. Please check settings.");
        } else {
          setError(response.data.error || "Failed to resend code");
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setError("Request timed out. Please try again.");
        } else if (error.response?.status === 503) {
          setError("Verification service unavailable. Please try later.");
        } else {
          setError("Network error. Please check your connection.");
        }
      } else {
        setError("Unexpected error. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };
  
  const handleCheckStatus = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      setIsChecking(true);
      
      const response = await axios.post(`/api/senders/${senderId}/check`);
      
      if (response.data.verified) {
        setSuccessMessage("Great news! Your sender has been verified successfully.");
        setTimeout(() => {
          onVerifiedAction();
          onCloseAction();
        }, 2000);
      } else {
        setError("The sender is not verified yet. Please enter the verification code from your email.");
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setError("Failed to check verification status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await axios.post(`/api/senders/${senderId}/confirm`, { 
        code: code.trim()
      });
      
      if (response.data.verified) {
        // If verification is complete
        setSuccessMessage("Sender successfully verified!");
        setTimeout(() => {
          onVerifiedAction();
          onCloseAction();
        }, 1500);
      } else {
        // If not verified, show error
        setError(response.data.message || response.data.error || "Verification failed. Please check the code and try again.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Failed to verify code. Please try again with the exact code from your email.");
      }
    } finally {
      setIsSubmitting(false);
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
              <FingerPrintIcon className="h-5 w-5 mr-2 text-blue-500" />
              Enter Verification Code
            </h3>
            
            <button
              onClick={onCloseAction}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {successMessage}
            </div>
          )}
          
          <div className="mt-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
                How to Verify Your Sender Email
              </h4>
              
              <ol className="list-decimal pl-5 text-sm text-blue-700 space-y-2">
                <li><strong>Check your email</strong> for a message from Brevo</li>
                <li><strong>Find the 6-digit verification code</strong> in the email</li>
                <li><strong>Enter the code</strong> in the field below</li>
              </ol>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <div className="mt-1">
                  <Input
                    id="verification-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="text-center tracking-widest font-mono text-lg"
                    autoComplete="off"
                    maxLength={6}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className={`text-sm text-blue-600 hover:text-blue-800 underline ${isResending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isResending ? 'Sending...' : "Didn't receive the code? Click to resend"}
                </button>
              </div>
              
              <div className="mt-6 flex justify-between space-x-3">
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handleCheckStatus}
                  loading={isChecking}
                  icon={<ArrowPathIcon className="h-4 w-4 mr-1.5" />}
                >
                  Check Status
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  variant="primary"
                >
                  Verify Code
                </Button>
              </div>
            </form>
          </div>
          
          <div className="mt-6 bg-yellow-50 p-4 rounded-md text-sm text-yellow-700 border border-yellow-100">
            <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 mr-2 text-yellow-600" />
              Trouble with verification?
            </h4>
            <p className="mb-3">
              If you&apos;re having trouble with the verification code, you can also verify directly through Brevo:
            </p>
            <ol className="list-decimal pl-5 text-sm space-y-1">
              <li>Log in to your Brevo account</li>
              <li>Go to &quot;Senders & IP&quot; in the settings menu</li>
              <li>Find your email address and click &quot;Verify&quot;</li>
            </ol>
            <div className="mt-3 text-center">
              <Button
                type="button"
                variant="outline-warning"
                size="sm"
                onClick={() => window.open('https://app.brevo.com/senders', '_blank')}
                icon={<ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />}
              >
                Open Brevo Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}