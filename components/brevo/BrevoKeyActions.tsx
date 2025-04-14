// components/brevo/BrevoKeyActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "../ui/Button";
import { TestEmailModal } from "./TestEmailModal";

interface BrevoKeyActionsProps {
  readonly keyId: string;  // Added readonly to satisfy SonarLint
  readonly isActive: boolean; // Added readonly to satisfy SonarLint
}

export function BrevoKeyActions({ keyId, isActive }: BrevoKeyActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this key?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await axios.delete(`/api/brevo-keys/${keyId}`);
      router.refresh();
    } catch (error) {
      console.error("Error deleting Brevo key:", error);
      alert("Failed to delete Brevo key. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      await axios.patch(`/api/brevo-keys/${keyId}`, { 
        isActive: !isActive 
      });
      router.refresh();
    } catch (error) {
      console.error("Error toggling Brevo key status:", error);
      alert("Failed to update Brevo key status. Please try again.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="info"
          size="sm"
          onClick={() => setShowTestModal(true)}
        >
          Test
        </Button>
        <Button
          type="button"
          variant="warning"
          size="sm"
          onClick={handleToggleStatus}
          loading={isToggling}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleDelete}
          loading={isDeleting}
        >
          Delete
        </Button>
      </div>
      
      {showTestModal && (
        <TestEmailModal 
          brevoKeyId={keyId} 
          onCloseAction={() => setShowTestModal(false)} // Changed to onCloseAction to match the updated TestEmailModal component
        />
      )}
    </>
  );
}