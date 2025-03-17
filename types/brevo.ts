// types/brevo.ts
export interface BrevoKey {
    id: string;
    name: string;
    apiKey: string;
    smtpUsername: string;
    smtpPassword: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface BrevoKeyFormData {
    name: string;
    apiKey: string;
    smtpUsername: string;
    smtpPassword: string;
  }