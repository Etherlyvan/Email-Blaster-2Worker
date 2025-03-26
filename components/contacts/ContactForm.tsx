// components/contacts/ContactForm.tsx
"use client";

import { useState } from "react"; // Removed unused useEffect import
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ContactGroup } from "../../types/group";
import { 
  EnvelopeIcon, 
  UserPlusIcon, 
  ArrowLeftIcon, 
  TagIcon, 
  DocumentTextIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Valid email is required"),
  additionalFields: z.array(
    z.object({
      key: z.string().min(1, "Field name is required"),
      value: z.string(),
    })
  ),
  groupIds: z.array(z.string()).min(0),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  readonly groups: readonly ContactGroup[];
  readonly onSuccess?: () => void;
  readonly initialData?: {
    id: string;
    email: string;
    additionalData?: Record<string, string | number | boolean | null>;
    groupContacts?: Array<{ contactGroup: { id: string } }>;
  };
}

export function ContactForm({ groups, onSuccess, initialData }: ContactFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Convert initial additionalData to additionalFields array format
  const getInitialAdditionalFields = () => {
    if (!initialData?.additionalData) return [];
    
    return Object.entries(initialData.additionalData)
      .filter(([key]) => key !== 'name') // Exclude name as it's handled separately
      .map(([key, value]) => ({
        key,
        value: String(value)
      }));
  };
  
  // Get initial group IDs
  const getInitialGroupIds = () => {
    if (!initialData?.groupContacts) return [];
    return initialData.groupContacts.map(gc => gc.contactGroup.id);
  };
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: initialData?.additionalData?.name as string || "",
      email: initialData?.email || "",
      additionalFields: getInitialAdditionalFields(),
      groupIds: getInitialGroupIds(),
    },
  });
  
  // Add new empty field
  const addField = () => {
    setValue('additionalFields', [...control._formValues.additionalFields, { key: '', value: '' }]);
  };
  
  // Remove field at index
  const removeField = (index: number) => {
    const currentFields = [...control._formValues.additionalFields];
    currentFields.splice(index, 1);
    setValue('additionalFields', currentFields);
  };
  
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Convert additionalFields array to additionalData object
      const additionalData: Record<string, string> = {};
      
      // Add name if provided
      if (data.name) {
        additionalData.name = data.name;
      }
      
      // Add all other fields
      data.additionalFields.forEach(field => {
        if (field.key.trim()) {
          additionalData[field.key.trim()] = field.value;
        }
      });
      
      if (initialData) {
        // Update existing contact
        await axios.put(`/api/contacts/${initialData.id}`, {
          email: data.email,
          additionalData,
          groupIds: data.groupIds,
        });
      } else {
        // Create new contact
        await axios.post("/api/contacts", {
          email: data.email,
          additionalData,
          groupIds: data.groupIds,
        });
      }
      
      reset();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/contacts");
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      alert("Failed to save contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate a unique ID for the form
  const formId = "contact-form-" + Math.random().toString(36).slice(2, 11);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center border-b pb-4 mb-2">
        <UserPlusIcon className="h-6 w-6 text-blue-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">
          {initialData ? "Edit Contact" : "Add New Contact"}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor={`${formId}-name`} className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserPlusIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id={`${formId}-name`}
              type="text"
              {...register("name")}
              placeholder="John Doe"
              className="pl-10"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor={`${formId}-email`} className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id={`${formId}-email`}
              type="email"
              {...register("email")}
              placeholder="contact@example.com"
              error={errors.email?.message}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Additional Fields
          </label>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            <DocumentTextIcon className="h-4 w-4 mr-1" />
            {showHelp ? "Hide Help" : "Show Help"}
          </button>
        </div>
        
        {showHelp && (
          <div className="mt-2 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
            <p className="font-medium mb-1">How to use additional fields:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Additional fields let you store custom information about each contact</li>
              <li>These fields can be used in email templates as <code className="bg-blue-100 px-1 rounded">{"{{fieldName}}"}</code></li>
              <li>Common fields include: company, phone, city, country, etc.</li>
              <li>You can filter and segment contacts based on these fields</li>
            </ul>
          </div>
        )}
        
        <div className="mt-3 space-y-3">
          <Controller
            control={control}
            name="additionalFields"
            render={({ field }) => (
              <div className="space-y-3">
                {field.value.map((item, index) => (
                  <div key={index} className="flex space-x-2">
                    <div className="w-2/5">
                      <Input
                        placeholder="Field name"
                        value={item.key}
                        onChange={(e) => {
                          const newFields = [...field.value];
                          newFields[index].key = e.target.value;
                          field.onChange(newFields);
                        }}
                        error={errors.additionalFields?.[index]?.key?.message}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) => {
                          const newFields = [...field.value];
                          newFields[index].value = e.target.value;
                          field.onChange(newFields);
                        }}
                        error={errors.additionalFields?.[index]?.value?.message}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline-danger"
                      size="sm" // Changed from "icon" to "sm"
                      onClick={() => removeField(index)}
                      title="Remove field"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          />
          
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={addField}
            className="w-full"
            icon={<PlusIcon className="h-4 w-4 mr-1.5" />}
          >
            Add Field
          </Button>
        </div>
      </div>
      
      <div>
        <label htmlFor={`${formId}-groupIds`} className="flex items-center text-sm font-medium text-gray-700">
          <TagIcon className="h-4 w-4 mr-1 text-gray-500" />
          Contact Groups
        </label>
        <Controller
          name="groupIds"
          control={control}
          render={({ field }) => (
            <div className="mt-1">
              <select
                id={`${formId}-groupIds`}
                multiple
                value={field.value}
                onChange={(e) => {
                  const options = Array.from(e.target.options)
                    .filter((option) => option.selected)
                    .map((option) => option.value);
                  field.onChange(options);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                size={Math.min(5, groups.length || 1)}
              >
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))
                ) : (
                  <option disabled value="">No groups available</option>
                )}
              </select>
            </div>
          )}
        />
        <p className="mt-1 text-xs text-gray-500 flex items-center">
          <InformationCircleIcon className="h-4 w-4 mr-1 text-gray-400" />
          Hold Ctrl (or Cmd on Mac) to select multiple groups
        </p>
      </div>
      
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          icon={<ArrowLeftIcon className="h-4 w-4 mr-1.5" />}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          loading={isSubmitting}
          variant="primary"
          icon={<UserPlusIcon className="h-4 w-4 mr-1.5" />}
        >
          {initialData ? "Update Contact" : "Create Contact"}
        </Button>
      </div>
    </form>
  );
}