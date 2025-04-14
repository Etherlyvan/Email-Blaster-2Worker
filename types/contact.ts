// types/contact.ts
export interface Contact {
    id: string;
    email: string;
    additionalData?: Record<string, string | number | boolean | null>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ContactFormData {
    email: string;
    additionalData?: Record<string, string | number | boolean | null>;
  }