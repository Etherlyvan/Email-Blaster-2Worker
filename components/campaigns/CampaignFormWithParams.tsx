// components/campaigns/CampaignFormWithParams.tsx  
"use client";

import { CampaignForm } from "./CampaignForm";
import { CampaignFormData } from "@/types/campaign";
import { BrevoKey } from "@/types/brevo";
import { ContactGroup } from "@/types/group";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface CampaignFormWithParamsProps {
  readonly brevoKeys: readonly BrevoKey[];
  readonly contactGroups: readonly ContactGroup[];
  readonly onSubmitAction: (data: CampaignFormData, sendNow: boolean) => Promise<void>;
  readonly initialData?: Partial<CampaignFormData>;
}

export function CampaignFormWithParams(props: CampaignFormWithParamsProps) {
  const searchParams = useSearchParams();
  const [templateId, setTemplateId] = useState<string | null>(null);
  
  useEffect(() => {
    const templateParam = searchParams.get('templateId');
    if (templateParam) {
      setTemplateId(templateParam);
    }
  }, [searchParams]);
  
  // Handle form submission with schedule awareness
  const handleSubmit = async (data: CampaignFormData, sendNow: boolean) => {
    // If there's a schedule, force sendNow to false
    const actualSendNow = data.schedule ? false : sendNow;
    
    console.log("Form submit with:", { 
      hasSchedule: !!data.schedule, 
      requestedSendNow: sendNow,
      actualSendNow
    });
    
    await props.onSubmitAction(data, actualSendNow);
  };
  
  return (
    <CampaignForm
      {...props}
      urlTemplateId={templateId}
      onSubmitAction={handleSubmit}
    />
  );
}