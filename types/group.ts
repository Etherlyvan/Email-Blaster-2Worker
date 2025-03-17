// types/group.ts
export interface ContactGroup {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
      groupContacts: number;
    };
  }
  
  export interface GroupFormData {
    name: string;
  }