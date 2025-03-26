// components/campaigns/CampaignForm.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { TemplateVariablesHelp } from "./TemplateVariablesHelp";
import { 
  EnvelopeIcon, 
  UserIcon, 
  PaperAirplaneIcon, 
  ClockIcon,
  DocumentTextIcon,
  TagIcon,
  KeyIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';

// Utility function to join class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

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

// Create a simple client-side-only label component to avoid hydration issues
function ClientLabel({ htmlFor, icon, text }: { htmlFor: string; icon: React.ReactNode; text: string }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return <div className="h-6 w-full bg-gray-100 rounded animate-pulse mb-1"></div>;
  }
  
  return (
    <label htmlFor={htmlFor} className="flex items-center space-x-2 text-sm font-medium text-gray-700">
      {icon}
      <span>{text}</span>
    </label>
  );
}

// Create a simple client-side-only helper text component
function ClientHelperText({ text }: { text: string }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return <div className="h-4 w-full bg-gray-50 rounded animate-pulse mt-1"></div>;
  }
  
  return <p className="mt-1 text-xs text-gray-500">{text}</p>;
}

// Component for inserting variables into the subject
function SubjectVariableSelector({ 
  variables, 
  onSelectVariable 
}: { 
  variables: string[], 
  onSelectVariable: (variable: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  if (variables.length === 0) {
    return null;
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Insert variable"
        title="Insert variable"
      >
        <PlusCircleIcon className="h-4 w-4" aria-hidden="true" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-56 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm right-0">
          <div className="px-3 py-2 text-xs font-medium text-gray-600 border-b">
            Insert Variable
          </div>
          {variables.map((variable) => (
            <button
              key={variable}
              type="button"
              className="text-gray-900 hover:bg-blue-50 hover:text-blue-700 block px-4 py-2 text-sm w-full text-left"
              onClick={() => {
                onSelectVariable(`{${variable}}`);
                setIsOpen(false);
              }}
            >
              {`{${variable}}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Main component wrapped with client-only rendering
function ClientCampaignForm(props: CampaignFormProps) {
  const {
    brevoKeys,
    contactGroups,
    onSubmitAction,
    initialData,
    urlTemplateId,
  } = props;
  
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);
  const [, setPreviewData] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isSendNow, setIsSendNow] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: initialData ?? {
      content: "<div style='font-family: Arial, sans-serif;'><p>Write your email content here...</p></div>",
    },
  });
  
  // Watch form values
  const content = watch("content") || "<div style='font-family: Arial, sans-serif;'><p>Write your email content here...</p></div>";
  const groupId = watch("groupId");
  const templateId = watch("templateId");
  const name = watch("name");
  const subject = watch("subject");
  
  // Update hasChanges state based on form state
  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty]);
  
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
      setValue("content", "<div style='font-family: Arial, sans-serif;'><p>Write your email content here...</p></div>");
    }
  };
  
  // Handle inserting a variable into the subject field
  const handleInsertSubjectVariable = (variable: string) => {
    const input = subjectInputRef.current;
    if (!input) return;
    
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = input.value;
    
    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
    
    setValue("subject", newValue, { shouldDirty: true });
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      if (input) {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }
    }, 0);
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
      reset(data); // Reset to prevent isDirty after saving
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
    setIsSendNow(true);
    
    try {
      await onSubmitAction(data, true);
      reset(data); // Reset to prevent isDirty after saving
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert("Failed to send campaign. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsSendNow(false);
    }
  });
  
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    router.back();
  }, [router, hasChanges]);
  
  // Generate a unique ID for the form - fix the deprecated substr
  const formId = "campaign-form-" + Math.random().toString(36).slice(2, 11);
  
  const tabItems = [
    { name: 'Campaign Details', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { name: 'Email Content', icon: <EnvelopeIcon className="h-5 w-5" /> },
  ];
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
          <Tab.List className="flex space-x-2 rounded-xl bg-blue-50 p-1">
            {tabItems.map((item) => (
              <Tab
                key={`tab-${item.name}`}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'
                  )
                }
              >
                <div className="flex items-center justify-center space-x-2">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-6">
            <Tab.Panel className={classNames('rounded-xl p-3')}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-6">
                    <div>
                      <ClientLabel 
                        htmlFor={`${formId}-name`} 
                        icon={<DocumentTextIcon className="h-5 w-5 text-gray-400" />}
                        text="Campaign Name*"
                      />
                      <div className="mt-1">
                        <Input
                          id={`${formId}-name`}
                          type="text"
                          {...register("name")}
                          placeholder="Summer Sale Announcement"
                          error={errors.name?.message}
                          className="py-3"
                        />
                      </div>
                      <ClientHelperText text="A descriptive name to identify this campaign" />
                    </div>
                    
                    <div>
                      <ClientLabel 
                        htmlFor={`${formId}-subject`} 
                        icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                        text="Email Subject*"
                      />
                      <div className="mt-1 relative">
                        <Input
                          id={`${formId}-subject`}
                          type="text"
                          {...register("subject")}
                          placeholder="Don't miss our summer sale!"
                          error={errors.subject?.message}
                          className="py-3 pr-10"
                          ref={subjectInputRef}
                        />
                        {availableVariables.length > 0 && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <SubjectVariableSelector 
                              variables={availableVariables} 
                              onSelectVariable={handleInsertSubjectVariable} 
                            />
                          </div>
                        )}
                      </div>
                      <ClientHelperText text={availableVariables.length > 0 
                        ? "You can personalize the subject with contact variables"
                        : "The subject line recipients will see in their inbox"} 
                      />
                    </div>
                    
                    <div>
                      <ClientLabel 
                        htmlFor={`${formId}-senderName`} 
                        icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                        text="Sender Name*"
                      />
                      <div className="mt-1">
                        <Input
                          id={`${formId}-senderName`}
                          type="text"
                          {...register("senderName")}
                          placeholder="John Doe"
                          error={errors.senderName?.message}
                          className="py-3"
                        />
                      </div>
                      <ClientHelperText text="The name that will appear as the sender" />
                    </div>
                    
                    <div>
                      <ClientLabel 
                        htmlFor={`${formId}-senderEmail`} 
                        icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                        text="Sender Email*"
                      />
                      <div className="mt-1">
                        <Input
                          id={`${formId}-senderEmail`}
                          type="email"
                          {...register("senderEmail")}
                          placeholder="john@example.com"
                          error={errors.senderEmail?.message}
                          className="py-3"
                        />
                      </div>
                      <ClientHelperText text="The email address that will appear as the sender" />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <ClientLabel 
                        htmlFor={`${formId}-brevoKeyId`} 
                        icon={<KeyIcon className="h-5 w-5 text-gray-400" />}
                        text="Brevo Key*"
                      />
                      <div className="mt-1">
                        <Controller
                          name="brevoKeyId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              id={`${formId}-brevoKeyId`}
                              value={field.value}
                              onChange={field.onChange}
                              error={errors.brevoKeyId?.message}
                              customSize="md"
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
                      <ClientHelperText text="The API key used to send this campaign" />
                    </div>
                    
                    <div>
                      <ClientLabel 
                        htmlFor={`${formId}-groupId`} 
                        icon={<TagIcon className="h-5 w-5 text-gray-400" />}
                        text="Contact Group*"
                      />
                      <div className="mt-1">
                        <Controller
                          name="groupId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              id={`${formId}-groupId`}
                              value={field.value}
                              onChange={field.onChange}
                              error={errors.groupId?.message}
                              customSize="md"
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
                      <ClientHelperText text="The group of contacts who will receive this campaign" />
                    </div>
                    
                    <div>
                      <ClientLabel 
                        htmlFor={`${formId}-templateId`} 
                        icon={<DocumentTextIcon className="h-5 w-5 text-gray-400" />}
                        text="Email Template (Optional)"
                      />
                      <div className="mt-1 flex items-center space-x-2">
                        <Controller
                          name="templateId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              id={`${formId}-templateId`}
                              value={field.value ?? ''}
                              onChange={field.onChange}
                              disabled={isLoadingTemplates}
                              customSize="md"
                              className="w-full"
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
                      <ClientHelperText text="Start with a pre-designed template or create from scratch" />
                    </div>
                    
                    <div>
                      <ClientLabel 
                        htmlFor={`${formId}-schedule`} 
                        icon={<ClockIcon className="h-5 w-5 text-gray-400" />}
                        text="Schedule (Optional)"
                      />
                      <div className="mt-1">
                        <Controller
                          name="schedule"
                          control={control}
                          render={({ field }) => (
                            <DateTimePicker
                              id={`${formId}-schedule`}
                              value={field.value}
                              onChange={field.onChange}
                              error={errors.schedule?.message}
                              minDate={new Date()}
                              className="py-3"
                            />
                          )}
                        />
                      </div>
                      <ClientHelperText text="Leave empty to save as draft or schedule for later" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-10 flex justify-between border-t border-gray-200 pt-6">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline-primary"
                      onClick={() => setSelectedTabIndex(1)}
                    >
                      Next: Email Content
                    </Button>
                  </div>
                </div>
              </div>
            </Tab.Panel>
            
            <Tab.Panel className={classNames('rounded-xl p-3')}>
              <div className="space-y-6">
                <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {name || 'Untitled Campaign'} - Email Content
                    </h2>
                    {subject && (
                      <p className="text-sm text-gray-500">
                        Subject: <span className="font-medium">{subject}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {availableVariables.length > 0 && (
                      <TemplateVariablesHelp variables={availableVariables} />
                    )}
                    
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setSelectedTabIndex(0)}
                      icon={<ArrowPathIcon className="h-4 w-4 mr-1" />}
                    >
                      Back to Details
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-lg border border-gray-200 shadow-sm">
                  <div className="p-1">
                    <EmailEditor
                      initialHtml={content}
                      onChangeAction={handleEditorChange}
                      availableVariables={availableVariables}
                    />
                  </div>
                </div>
                
                <div className="mt-10 flex justify-between border-t border-gray-200 pt-6">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="secondary"
                      onClick={handleSaveAsDraft}
                      loading={isSubmitting && !isSendNow}
                      disabled={!hasChanges}
                      icon={<CheckCircleIcon className="h-4 w-4 mr-1.5" />}
                    >
                      Save as Draft
                    </Button>
                    <Button 
                      variant="primary"
                      onClick={handleSendNow}
                      loading={isSubmitting && isSendNow}
                      icon={<PaperAirplaneIcon className="h-4 w-4 mr-1.5" />}
                    >
                      {watch("schedule") ? "Schedule Campaign" : "Send Now"}
                    </Button>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}

// Server-side placeholder
function ServerPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse mb-6"></div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-gray-50 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-gray-50 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// The actual exported component with client-side rendering only
export function CampaignForm(props: CampaignFormProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return <ServerPlaceholder />;
  }
  
  return <ClientCampaignForm {...props} />;
}