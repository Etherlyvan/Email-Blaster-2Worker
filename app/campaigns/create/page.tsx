// app/campaigns/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { CampaignForm } from "../../../components/campaigns/CampaignForm";
import { BrevoKey } from "../../../types/brevo";
import { ContactGroup } from "../../../types/group";
import { Card } from "../../../components/ui/Card";
import { CampaignFormData } from "../../../types/campaign";

// Create a client component for the Settings link button
function SettingsLinkButton() {
  return (
    <Link
      href="/settings"
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Go to Settings
    </Link>
  );
}

// Create a client component for the Create Group button
function CreateGroupButton() {
  return (
    <Link
      href="/groups/create"
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Create Group
    </Link>
  );
}

// Add this component definition here
interface CampaignFormWithParamsProps {
  readonly brevoKeys: readonly BrevoKey[];
  readonly contactGroups: readonly ContactGroup[];
  readonly onSubmitAction: (data: CampaignFormData, sendNow: boolean) => Promise<void>;
}

function CampaignFormWithParams({
  brevoKeys,
  contactGroups,
  onSubmitAction
}: CampaignFormWithParamsProps) {
  const searchParams = useSearchParams();
  const templateId = searchParams ? searchParams.get('templateId') : null;

  return (
    <CampaignForm
      brevoKeys={brevoKeys}
      contactGroups={contactGroups}
      onSubmitAction={onSubmitAction}
      initialData={{}}
      urlTemplateId={templateId}
    />
  );
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const [brevoKeys, setBrevoKeys] = useState<BrevoKey[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const [brevoKeysResponse, groupsResponse] = await Promise.all([
          axios.get("/api/brevo-keys"),
          axios.get("/api/groups")
        ]);
        
        setBrevoKeys(brevoKeysResponse.data.filter((key: BrevoKey) => key.isActive));
        setContactGroups(groupsResponse.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load required data. Please try again later.");
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  const handleSubmit = async (data: CampaignFormData, sendNow: boolean) => {
    try {
      await axios.post("/api/campaigns", {
        ...data,
        sendNow,
        schedule: data.schedule ? data.schedule.toISOString() : undefined
      });
      router.push("/campaigns");
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign. Please try again.");
      throw error;
    }
  };
  
  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading...</div>;
  }
  
  if (brevoKeys.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6 text-center">
            <h2 className="text-lg font-medium text-gray-900">No Brevo Keys Available</h2>
            <p className="mt-2 text-sm text-gray-500">
              You need to add a Brevo API key before creating a campaign.
            </p>
            <div className="mt-4">
              <SettingsLinkButton />
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (contactGroups.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6 text-center">
            <h2 className="text-lg font-medium text-gray-900">No Contact Groups Available</h2>
            <p className="mt-2 text-sm text-gray-500">
              You need to create a contact group before creating a campaign.
            </p>
            <div className="mt-4">
              <CreateGroupButton />
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Create Campaign</h1>
      
      <CampaignFormWithParams
        brevoKeys={brevoKeys}
        contactGroups={contactGroups}
        onSubmitAction={handleSubmit}
      />
    </div>
  );
}