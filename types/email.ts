// types/email.ts
export type EmailStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED';

export interface EmailDelivery {
  id: string;
  campaignId: string;
  contactId: string;
  status: EmailStatus;
  messageId?: string;
  sentAt?: Date | string;
  openedAt?: Date | string;
  clickedAt?: Date | string;
  errorMessage?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  contact: {
    id: string;
    email: string;
    additionalData?: Record<string, string | number | boolean | null>;
  };
}