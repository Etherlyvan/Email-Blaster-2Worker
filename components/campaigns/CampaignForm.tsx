// components/campaigns/CampaignForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BrevoKey } from "../../types/brevo";
import { ContactGroup } from "../../types/group";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { DateTimePicker } from "../ui/DateTimePicker";
import { EmailEditor } from "../editor/EmailEditor";
import { Button } from "../ui/Button";
import { TemplateSelector } from "./TemplateSelector";

interface EmailTemplate {
  id: string;
  name: string;
  content: string;
  htmlContent: string;
}

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Valid email is required"),
  content: z.string(),
  brevoKeyId: z.string().min(1, "Brevo key is required"),
  groupId: z.string().min(1, "Contact group is required"),
  templateId: z.string().optional(),
  schedule: z.date().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  readonly brevoKeys: readonly BrevoKey[];
  readonly contactGroups: readonly ContactGroup[];
  readonly onSubmitAction: (data: CampaignFormData, sendNow: boolean) => Promise<void>;
  readonly initialData?: Partial<CampaignFormData>;
  readonly urlTemplateId?: string | null;
}

export function CampaignForm({
  brevoKeys,
  contactGroups,
  onSubmitAction,
  initialData,
  urlTemplateId,
}: CampaignFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: initialData ?? {
      content: "<p>Write your email content here...</p>",
    },
  });
  
  // Make sure content is never undefined
  const content = watch("content") || "<p>Write your email content here...</p>";
  const groupId = watch("groupId");
  const templateId = watch("templateId");
  
  // Fetch templates
  useEffect(() => {
    async function fetchTemplates() {
      setIsLoadingTemplates(true);
      try {
        const response = await axios.get('/api/templates');
        setTemplates(response.data);
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    
    fetchTemplates();
  }, []);
  
  // Check for template ID from URL params passed as prop
  useEffect(() => {
    if (urlTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === urlTemplateId);
      if (template) {
        setValue("templateId", template.id);
        setValue("content", template.content);
      }
    }
  }, [urlTemplateId, templates, setValue]);
  
  // Update content when template changes
  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setValue("content", template.content);
      }
    }
  }, [templateId, templates, setValue]);
  
  // Update available variables when group changes
  useEffect(() => {
    if (groupId) {
      // Fetch sample contact data from the selected group
      fetch(`/api/groups/${groupId}/variables`)
        .then(res => res.json())
        .then(data => {
          setAvailableVariables(data.variables || []);
          setPreviewData(data.sampleData || {});
        })
        .catch(err => {
          console.error("Failed to fetch variables:", err);
        });
    }
  }, [groupId]);
  
  // Handle editor change with proper error handling
  const handleEditorChange = (html: string) => {
    if (typeof html === 'string') {
      setValue("content", html);
    } else {
      console.warn("Received non-string content from editor:", html);
      setValue("content", "<p>Write your email content here...</p>");
    }
  };
  
  const handleTemplateSelect = (templateId: string, htmlContent: string) => {
    setValue("templateId", templateId);
    if (typeof htmlContent === 'string' && htmlContent.trim()) {
      setValue("content", htmlContent);
    } else {
      console.warn("Received invalid HTML content from template");
    }
  };
  
  const handleSaveAsDraft = handleSubmit(async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await onSubmitAction(data, false);
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  });
  
  const handleSendNow = handleSubmit(async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await onSubmitAction(data, true);
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert("Failed to send campaign. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  });
  
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Campaign Name
          </label>
          <Input
            id="name"
            type="text"
            {...register("name")}
            placeholder="Summer Sale Announcement"
            error={errors.name?.message}
          />
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Email Subject
          </label>
          <Input
            id="subject"
            type="text"
            {...register("subject")}
            placeholder="Don't miss our summer sale!"
            error={errors.subject?.message}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="senderName" className="block text-sm font-medium text-gray-700">
            Sender Name
          </label>
          <Input
            id="senderName"
            type="text"
            {...register("senderName")}
            placeholder="John Doe"
            error={errors.senderName?.message}
          />
        </div>
        
        <div>
          <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700">
            Sender Email
          </label>
          <Input
            id="senderEmail"
            type="email"
            {...register("senderEmail")}
            placeholder="john@example.com"
            error={errors.senderEmail?.message}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="brevoKeyId" className="block text-sm font-medium text-gray-700">
            Brevo Key
          </label>
          <Controller
            name="brevoKeyId"
            control={control}
            render={({ field }) => (
              <Select
                id="brevoKeyId"
                value={field.value}
                onChange={field.onChange}
                error={errors.brevoKeyId?.message}
              >
                <option value="">Select a Brevo key</option>
                {brevoKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>
        
        <div>
          <label htmlFor="groupId" className="block text-sm font-medium text-gray-700">
            Contact Group
          </label>
          <Controller
            name="groupId"
            control={control}
            render={({ field }) => (
              <Select
                id="groupId"
                value={field.value}
                onChange={field.onChange}
                error={errors.groupId?.message}
              >
                <option value="">Select a contact group</option>
                {contactGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group._count?.groupContacts ? `(${group._count.groupContacts})` : ''}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <label htmlFor="templateId" className="block text-sm font-medium text-gray-700">
            Email Template (Optional)
          </label>
          <div className="flex items-center mt-1 space-x-2">
            <Controller
              name="templateId"
              control={control}
              render={({ field }) => (
                <Select
                  id="templateId"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  disabled={isLoadingTemplates}
                  className="w-64"
                >
                  <option value="">Select a template or create from scratch</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              )}
            />
            <TemplateSelector onSelectTemplateAction={handleTemplateSelect} />
          </div>
          {isLoadingTemplates && <p className="mt-1 text-sm text-gray-500">Loading templates...</p>}
        </div>
        
        <div>
          <label htmlFor="schedule" className="block text-sm font-medium text-gray-700">
            Schedule (Optional)
          </label>
          <Controller
            name="schedule"
            control={control}
            render={({ field }) => (
              <DateTimePicker
                id="schedule"
                value={field.value}
                onChange={field.onChange}
                error={errors.schedule?.message}
                minDate={new Date()}
              />
            )}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <EmailEditor
          initialHtml={content}
          onChangeAction={handleEditorChange}
          availableVariables={availableVariables}
        />
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button onClick={handleCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSaveAsDraft} loading={isSubmitting}>
          Save as Draft
        </Button>
        <Button onClick={handleSendNow} loading={isSubmitting}>
          {initialData?.schedule ? "Schedule" : "Send Now"}
        </Button>
      </div>
    </div>
  );
}