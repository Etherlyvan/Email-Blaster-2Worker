// components/senders/DeleteSenderButton.tsx

import { useState } from 'react';
import { Button } from '../ui/Button';
import { TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify'; // Using react-toastify instead of sonner
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DeleteSenderButtonProps {
  readonly senderId: string;
  readonly senderName: string;
  readonly senderEmail: string;
  readonly onDeleted: () => void;
}

export function DeleteSenderButton({
  senderId,
  senderName,
  senderEmail,
  onDeleted
}: DeleteSenderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  const [usageData, setUsageData] = useState<{
    inUse: boolean;
    count: number;
    campaigns: Array<{ id: string; name: string }>;
  } | null>(null);

  const handleDelete = async () => {
    // First check if sender is in use
    setIsCheckingUsage(true);
    try {
      const usageResponse = await axios.get(`/api/senders/${senderId}/check-usage`);
      const usage = usageResponse.data;
      
      setUsageData(usage);
      
      if (usage.inUse) {
        // If in use, don't proceed with deletion
        toast.error(`Cannot delete sender that is used in ${usage.count} campaign(s)`);
        setIsOpen(false);
        setIsCheckingUsage(false);
        return;
      }
      
      // If not in use, proceed with deletion
      setIsCheckingUsage(false);
      setIsDeleting(true);
      
      try {
        await axios.delete(`/api/senders/${senderId}`);
        toast.success('Sender deleted successfully');
        setIsOpen(false);
        onDeleted();
      } catch (error) {
        console.error('Error deleting sender:', error);
        
        if (axios.isAxiosError(error) && error.response?.data?.usedInCampaigns) {
          toast.error(error.response?.data?.error || 'Cannot delete sender that is used in campaigns');
        } else {
          toast.error('Failed to delete sender');
        }
      }
    } catch (error) {
      console.error('Error checking sender usage:', error);
      toast.error('Error checking if sender is in use');
    } finally {
      setIsCheckingUsage(false);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setIsOpen(true)}
        icon={<TrashIcon className="h-4 w-4" />}
      >
        Delete
      </Button>

      {/* Custom confirmation dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="min-h-screen px-4 text-center">
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          
          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          
          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            <div className="flex justify-between items-center">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Delete Sender
              </Dialog.Title>
              
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={() => setIsOpen(false)}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            
            <div className="mt-3">
              {usageData?.inUse ? (
                <div>
                  <p className="text-red-600 font-medium">
                    This sender cannot be deleted because it is used in {usageData.count} campaign(s):
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 list-disc pl-5">
                    {usageData.campaigns.map(campaign => (
                      <li key={campaign.id}>{campaign.name}</li>
                    ))}
                    {usageData.count > usageData.campaigns.length && (
                      <li className="italic">
                        ...and {usageData.count - usageData.campaigns.length} more
                      </li>
                    )}
                  </ul>
                  <p className="mt-3 text-sm text-gray-700">
                    Please update or delete these campaigns before deleting this sender.
                  </p>
                </div>
              ) : (
                <div>
                  <p>
                    Are you sure you want to delete the sender <span className="font-medium">{senderName}</span>{' '}
                    with email <span className="font-medium">{senderEmail}</span>?
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    This action cannot be undone. The sender will be permanently deleted from both
                    your account and Brevo.
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting || isCheckingUsage}
              >
                Cancel
              </Button>
              
              {!usageData?.inUse && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  loading={isDeleting || isCheckingUsage}
                  icon={isCheckingUsage ? undefined : <TrashIcon className="h-4 w-4 mr-1.5" />}
                >
                  {isCheckingUsage ? "Checking..." : isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}