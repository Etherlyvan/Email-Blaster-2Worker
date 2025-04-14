// types/campaign.ts 
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  content: string; // This now stores HTML content
  status: CampaignStatus;
  schedule?: Date | string | null;
  brevoKeyId: string | null;
  groupId: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  brevoKey?: {
    id: string;
    name: string;
  } | null;
  group?: {
    id: string;
    name: string;
  };
}

export interface CampaignFormData {
  name: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  content: string;
  brevoKeyId: string;
  groupId: string;
  schedule?: Date;
}