// components/groups/GroupForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface GroupFormProps {
  readonly onSuccess?: () => void;
  readonly initialData?: {
    readonly id: string;
    readonly name: string;
  };
}

// Fixed: Removed 'readonly' from the parameter destructuring pattern
export function GroupForm({ onSuccess, initialData }: GroupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: initialData?.name ?? "",
    },
  });
  
  const onSubmit = async (data: GroupFormData) => {
    setIsSubmitting(true);
    
    try {
      if (initialData) {
        // Update existing group
        await axios.put(`/api/groups/${initialData.id}`, data);
      } else {
        // Create new group
        await axios.post("/api/groups", data);
      }
      
      reset();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/groups");
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving group:", error);
      alert("Failed to save group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Group Name
        </label>
        <Input
          id="name"
          type="text"
          {...register("name")}
          placeholder="Newsletter Subscribers"
          error={errors.name?.message}
        />
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {initialData ? "Update Group" : "Create Group"}
        </Button>
      </div>
    </form>
  );
}