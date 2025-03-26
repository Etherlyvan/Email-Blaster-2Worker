// components/campaigns/CampaignFormWithParams.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { CampaignForm } from "./CampaignForm";
import { BrevoKey } from "../../types/brevo";
import { ContactGroup } from "../../types/group";
import { CampaignFormData } from "../../types/campaign";

interface CampaignFormWithParamsProps {
  readonly brevoKeys: BrevoKey[];
  readonly contactGroups: ContactGroup[];
  readonly onSubmitAction: (data: CampaignFormData, sendNow: boolean) => Promise<void>;
  readonly initialData?: Partial<CampaignFormData>;
}

export function CampaignFormWithParams({
  brevoKeys,
  contactGroups,
  onSubmitAction,
  initialData = {}
}: CampaignFormWithParamsProps) {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get('templateId');

  return (
    <CampaignForm
      brevoKeys={brevoKeys}
      contactGroups={contactGroups}
      onSubmitAction={onSubmitAction}
      initialData={initialData}
      urlTemplateId={templateId}
    />
  );
}