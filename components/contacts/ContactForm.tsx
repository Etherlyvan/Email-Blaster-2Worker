// components/contacts/ContactForm.tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ContactGroup } from "../../types/group";

const contactSchema = z.object({
  email: z.string().email("Valid email is required"),
  additionalData: z.string().optional(),
  groupIds: z.array(z.string()).min(0),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
    readonly groups: readonly ContactGroup[];
    readonly onSuccess?: () => void;
}

export function ContactForm({ groups, onSuccess }: ContactFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: "",
      additionalData: "",
      groupIds: [],
    },
  });
  
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Parse additional data
      let parsedAdditionalData = {};
      if (data.additionalData) {
        // Parse as key-value pairs, one per line: key=value
        const pairs = data.additionalData.split("\n");
        for (const pair of pairs) {
          const [key, value] = pair.split("=").map(s => s.trim());
          if (key && value) {
            parsedAdditionalData = { ...parsedAdditionalData, [key]: value };
          }
        }
      }
      
      await axios.post("/api/contacts", {
        email: data.email,
        additionalData: parsedAdditionalData,
        groupIds: data.groupIds,
      });
      
      reset();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/contacts");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("Failed to create contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="contact@example.com"
          error={errors.email?.message}
        />
      </div>
      
      <div>
        <label htmlFor="additionalData" className="block text-sm font-medium text-gray-700">
          Additional Data (one parameter per line, format: key=value)
        </label>
        <textarea
          id="additionalData"
          {...register("additionalData")}
          rows={5}
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.additionalData ? "border-red-300" : "border-gray-300"
          }`}
          placeholder={`name=John Doe
company=ACME Inc.
role=Manager`}
        ></textarea>
        {errors.additionalData && (
          <p className="mt-1 text-sm text-red-600">{errors.additionalData.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
            These parameters can be used in email templates with {'{{'} parameter {'}}' } syntax.
        </p>
      </div>
      
      {groups.length > 0 && (
        <div>
          <label htmlFor="groupIds" className="block text-sm font-medium text-gray-700">
            Groups
          </label>
          <Controller
            name="groupIds"
            control={control}
            render={({ field }) => (
              <select
                id="groupIds"
                multiple
                value={field.value}
                onChange={(e) => {
                  const options = Array.from(e.target.options)
                    .filter((option) => option.selected)
                    .map((option) => option.value);
                  field.onChange(options);
                }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.groupIds ? "border-red-300" : "border-gray-300"
                }`}
                size={Math.min(5, groups.length)}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.groupIds && (
            <p className="mt-1 text-sm text-red-600">{errors.groupIds.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Hold Ctrl (or Cmd) to select multiple groups.
          </p>
        </div>
      )}
      
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create Contact
        </Button>
      </div>
    </form>
  );
}