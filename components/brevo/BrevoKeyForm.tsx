// components/brevo/BrevoKeyForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const brevoKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  apiKey: z.string().min(1, "API key is required"),
  smtpUsername: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
});

type BrevoKeyFormData = z.infer<typeof brevoKeySchema>;

export function BrevoKeyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BrevoKeyFormData>({
    resolver: zodResolver(brevoKeySchema),
  });
  
  const onSubmit = async (data: BrevoKeyFormData) => {
    setIsSubmitting(true);
    try {
      await axios.post("/api/brevo-keys", data);
      reset();
      router.refresh();
    } catch (error) {
      console.error("Error creating Brevo key:", error);
      alert("Failed to create Brevo key. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <Input
          id="name"
          type="text"
          {...register("name")}
          placeholder="My Brevo Key"
          error={errors.name?.message}
        />
      </div>
      
      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
          API Key
        </label>
        <Input
          id="apiKey"
          type="text"
          {...register("apiKey")}
          placeholder="xkeysib-..."
          error={errors.apiKey?.message}
        />
      </div>
      
      <div>
        <label htmlFor="smtpUsername" className="block text-sm font-medium text-gray-700">
          SMTP Username
        </label>
        <Input
          id="smtpUsername"
          type="text"
          {...register("smtpUsername")}
          placeholder="smtp-username"
          error={errors.smtpUsername?.message}
        />
      </div>
      
      <div>
        <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700">
          SMTP Password
        </label>
        <Input
          id="smtpPassword"
          type="password"
          {...register("smtpPassword")}
          placeholder="••••••••"
          error={errors.smtpPassword?.message}
        />
      </div>
      
      <Button type="submit" loading={isSubmitting} className="w-full">
        Add Brevo Key
      </Button>
    </form>
  );
}