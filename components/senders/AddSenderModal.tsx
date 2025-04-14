// components/senders/AddSenderModal.tsx

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios, { AxiosError } from "axios";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { 
  XMarkIcon, 
  EnvelopeIcon, 
  UserIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

// Create a schema for a single sender
const senderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
});

// Create a schema for multiple senders
const sendersFormSchema = z.object({
  senders: z.array(senderSchema).min(1, "At least one sender is required"),
});

type SendersFormData = z.infer<typeof sendersFormSchema>;

interface AddSenderModalProps {
  readonly isOpen: boolean;
  readonly onCloseAction: () => void;
  readonly onAddedAction: () => void;
}

export function AddSenderModal({ isOpen, onCloseAction, onAddedAction }: AddSenderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<SendersFormData>({
    resolver: zodResolver(sendersFormSchema),
    defaultValues: {
      senders: [{ name: "", email: "" }]
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "senders",
  });
  
  const onSubmit = async (data: SendersFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessCount(0);
    
    try {
      // If multiple senders, use the bulk API
      if (data.senders.length > 1) {
        const response = await axios.post("/api/senders", { senders: data.senders });
        
        if (response.data.success) {
          setSuccessCount(response.data.successful);
          
          if (response.data.successful === data.senders.length) {
            // All senders added successfully
            reset();
            onAddedAction();
            onCloseAction();
          } else if (response.data.successful > 0) {
            // Some senders were added successfully
            setError(`${response.data.successful} out of ${data.senders.length} senders were added successfully. Please check for duplicate emails.`);
          } else {
            // No senders were added
            setError("Failed to add any senders. Please check for duplicate emails or API issues.");
          }
        } else {
          setError(response.data.error || "Failed to add senders");
        }
      } else {
        // Single sender, use the simple API
        const response = await axios.post("/api/senders", { senders: data.senders });
        console.log("Bulk senders creation response:", response.data);
        
        // If successful, close the modal and refresh
        reset();
        onAddedAction();
        onCloseAction();
      }
    } catch (error) {
      console.error("Error adding senders:", error);
      const axiosError = error as AxiosError<{ error?: string }>;
      setError(axiosError.response?.data?.error ?? "Failed to add senders. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addSender = () => {
    append({ name: "", email: "" });
  };
  
  return (
    <Dialog
      open={isOpen}
      onClose={onCloseAction}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
        
        <span
          className="inline-block h-screen align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>
        
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-500" />
              Add New Sender(s)
            </h3>
            
            <button
              onClick={onCloseAction}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          {successCount > 0 && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              Successfully added {successCount} sender(s).
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Sender #{index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline-danger"
                        size="sm"
                        onClick={() => remove(index)}
                        icon={<TrashIcon className="h-4 w-4" />}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label htmlFor={`senders.${index}.name`} className="block text-sm font-medium text-gray-700">
                        Sender Name
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id={`senders.${index}.name`}
                          type="text"
                          placeholder="John Doe"
                          className="pl-10"
                          {...register(`senders.${index}.name`)}
                          error={errors.senders?.[index]?.name?.message}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor={`senders.${index}.email`} className="block text-sm font-medium text-gray-700">
                        Sender Email
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id={`senders.${index}.email`}
                          type="email"
                          placeholder="john@example.com"
                          className="pl-10"
                          {...register(`senders.${index}.email`)}
                          error={errors.senders?.[index]?.email?.message}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline-secondary"
                onClick={addSender}
                className="w-full"
                icon={<PlusIcon className="h-4 w-4 mr-1.5" />}
              >
                Add Another Sender
              </Button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md mt-4">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Verification Required</h4>
                  <p className="mt-1 text-xs text-blue-700">
                    After adding senders, you&apos;ll need to verify each email address. A verification email will be sent, 
                    and you must click the link in that email to complete verification before using a sender for campaigns.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline-secondary"
                onClick={onCloseAction}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                variant="primary"
              >
                Add {fields.length > 1 ? 'Senders' : 'Sender'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}