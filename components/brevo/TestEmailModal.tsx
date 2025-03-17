// components/brevo/TestEmailModal.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const testEmailSchema = z.object({
  to: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

type TestEmailFormData = z.infer<typeof testEmailSchema>;

interface TestEmailModalProps {
  readonly brevoKeyId: string;
  readonly onCloseAction: () => void; // Renamed to end with "Action" to satisfy the serialization requirement
}

export function TestEmailModal({ brevoKeyId, onCloseAction }: TestEmailModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TestEmailFormData>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      subject: "Test Email from Email Campaign App",
      message: "This is a test email to verify your Brevo integration is working correctly.",
    },
  });
  
  const handleSendTest = async (data: TestEmailFormData) => {
    setIsSending(true);
    setResult(null);
    
    try {
      // Removed the unused response variable
      await axios.post(`/api/brevo-keys/${brevoKeyId}/test-email`, data);
      
      setResult({
        success: true,
        message: "Test email sent successfully!",
      });
    } catch (error) {
      console.error("Failed to send test email:", error);
      setResult({
        success: false,
        message: "Failed to send test email. Please check your Brevo credentials.",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Send Test Email</h2>
          <button
            type="button"
            onClick={onCloseAction}
            className="text-gray-400 hover:text-gray-500"
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit(handleSendTest)} className="space-y-4">
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700">
              Recipient Email
            </label>
            <Input
              id="to"
              type="email"
              {...register("to")}
              placeholder="recipient@example.com"
              error={errors.to?.message}
            />
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <Input
              id="subject"
              type="text"
              {...register("subject")}
              error={errors.subject?.message}
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              {...register("message")}
              rows={4}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.message ? "border-red-300" : "border-gray-300"
              }`}
            ></textarea>
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>
          
          {result && (
            <div className={`p-3 rounded-md ${
              result.success
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}>
              {result.message}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCloseAction}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSending}
            >
              Send Test Email
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}