// components/campaigns/CampaignDetailActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "../ui/Button";
import { PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CampaignDetailActionsProps {
  readonly campaign: {
    id: string;
    status: string;
    brevoKeyId: string | null;
  };
}

export function CampaignDetailActions({ campaign }: CampaignDetailActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await axios.delete(`/api/campaigns/${campaign.id}`);
      router.push("/campaigns");
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      alert("Failed to delete campaign. Please try again.");
      setIsDeleting(false);
    }
  };
  
  const handleSendNow = async () => {
    if (!campaign.brevoKeyId) {
      alert("This campaign doesn't have a Brevo key assigned. Please edit the campaign to add a Brevo key.");
      return;
    }
    
    if (!confirm("Are you sure you want to send this campaign now?")) {
      return;
    }
    
    setIsSending(true);
    
    try {
      await axios.post(`/api/campaigns/${campaign.id}/send`);
      router.refresh();
    } catch (error) {
      console.error("Failed to send campaign:", error);
      alert("Failed to send campaign. Please try again.");
      setIsSending(false);
    }
  };
  
  if (campaign.status === 'DRAFT') {
    return (
      <>
        <Button 
          onClick={handleSendNow} 
          loading={isSending}
          disabled={!campaign.brevoKeyId}
          title={!campaign.brevoKeyId ? "Missing Brevo key" : "Send campaign now"}
          variant="primary"
          size="sm"
          icon={<PaperAirplaneIcon className="h-4 w-4 mr-1.5" />}
        >
          Send Now
        </Button>
        
        <Button 
          variant="danger" 
          size="sm"
          onClick={handleDelete} 
          loading={isDeleting}
          icon={<TrashIcon className="h-4 w-4 mr-1.5" />}
        >
          Delete
        </Button>
      </>
    );
  }
  
  if (campaign.status === 'SCHEDULED') {
    return (
      <Button 
        variant="danger" 
        size="sm"
        onClick={handleDelete} 
        loading={isDeleting}
        icon={<TrashIcon className="h-4 w-4 mr-1.5" />}
      >
        Delete
      </Button>
    );
  }
  
  return null;
}