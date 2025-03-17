// components/campaigns/CampaignDetailActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "../ui/Button";
import { Campaign } from "../../types/campaign";

interface CampaignDetailActionsProps {
  readonly campaign: Campaign;
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
  
  return (
    <>
      {campaign.status === 'DRAFT' && (
        <Button 
          onClick={handleSendNow} 
          loading={isSending}
          disabled={!campaign.brevoKeyId}
          title={!campaign.brevoKeyId ? "Missing Brevo key" : "Send campaign now"}
        >
          Send Now
        </Button>
      )}
      
      {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
        <Button 
          variant="danger" 
          onClick={handleDelete} 
          loading={isDeleting}
        >
          Delete
        </Button>
      )}
    </>
  );
}