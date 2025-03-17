// components/contacts/ContactImport.tsx
"use client";

import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as XLSX from "xlsx";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { ContactGroup } from "../../types/group";

const importSchema = z.object({
  groupIds: z.array(z.string()).min(1, "Select at least one group"),
  file: z.any().refine((file) => file instanceof File, "File is required"),
});

type ImportFormData = z.infer<typeof importSchema>;
type ContactFieldValue = string | number | boolean | null;
// Define a proper interface for contact data
interface Contact {
  email: string;
  [key: string]: ContactFieldValue;
}

// Define a proper interface for Excel row data
interface ExcelRowData {
    [key: string]: ContactFieldValue;
}

// Interface for the transformed contact data with additionalData as a nested object
interface ContactWithAdditionalData {
  email: string;
  additionalData: Record<string, string | number | boolean | null>;
}

// Define a type alias for the import stage
type ImportStage = 'upload' | 'mapping' | 'review' | 'importing';
  
interface ContactImportProps {
  readonly contactGroups: ContactGroup[];
  readonly onImportAction: (contacts: ContactWithAdditionalData[], groupIds: string[]) => Promise<void>;
}

export function ContactImport({ contactGroups, onImportAction }: ContactImportProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<Contact[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [emailColumn, setEmailColumn] = useState<string | null>(null);
  const [stage, setStage] = useState<ImportStage>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      groupIds: [],
    },
  });
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setValue("file", file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRowData>(firstSheet);
        
        if (jsonData.length === 0) {
          alert("No data found in the file");
          return;
        }
        
        // Get headers
        const allHeaders = Object.keys(jsonData[0]);
        setHeaders(allHeaders);
        
        // Try to find an email column
        const emailColumnGuess = allHeaders.find(
          (header) => header.toLowerCase().includes("email")
        );
        setEmailColumn(emailColumnGuess ?? null);
        
        // Convert to properly typed contacts
        const typedContacts: Contact[] = jsonData.map(row => {
          // Ensure each row has at least an empty email field
          return { 
            email: '', 
            ...row 
          };
        });
        
        setParsedContacts(typedContacts);
        setStage('mapping');
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("Error parsing Excel file. Please make sure it's a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleFormSubmit = async (data: ImportFormData) => {
    if (!emailColumn || parsedContacts.length === 0) {
      alert("Please select an email column");
      return;
    }
    
    setIsSubmitting(true);
    setStage('importing');
    
    try {
      // Map the contacts to the right format
      const formattedContacts: ContactWithAdditionalData[] = parsedContacts.map((contact) => {
        const email = String(contact[emailColumn]).trim();
        const additionalData: Record<string, string | number | boolean | null> = { ...contact };
        delete additionalData[emailColumn];
        
        return {
          email,
          additionalData,
        };
      });
      
      // Filter out invalid emails
      const validContacts = formattedContacts.filter(
        (contact) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)
      );
      
      if (validContacts.length === 0) {
        alert("No valid email addresses found");
        setStage('mapping');
        return;
      }
      
      await onImportAction(validContacts, data.groupIds);
      
      // Reset form
      if (fileInputRef.current) fileInputRef.current.value = "";
      setParsedContacts([]);
      setHeaders([]);
      setEmailColumn(null);
      setStage('upload');
    } catch (error) {
      console.error("Error importing contacts:", error);
      alert("Error importing contacts. Please try again.");
      setStage('mapping');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label htmlFor="groupIds" className="block text-sm font-medium text-gray-700">
          Contact Groups
        </label>
        <Controller
          name="groupIds"
          control={control}
          render={({ field }) => (
            <Select
              id="groupIds"
              multiple
              value={field.value}
              onChange={(e) => {
                const options = Array.from(e.target.options)
                  .filter((option) => option.selected)
                  .map((option) => option.value);
                field.onChange(options);
              }}
              error={errors.groupIds?.message}
            >
              {contactGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          )}
        />
      </div>
      
      <div>
        <label htmlFor="file-input" className="block text-sm font-medium text-gray-700">
          Excel File
        </label>
        <input
          id="file-input"
          type="file"
          ref={fileInputRef}
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {errors.file && (
          <p className="mt-1 text-sm text-red-600">{errors.file.message as string}</p>
        )}
      </div>
      
      {headers.length > 0 && (
        <div>
          <label htmlFor="emailColumn" className="block text-sm font-medium text-gray-700">
            Email Column
          </label>
          <Select
            id="emailColumn"
            value={emailColumn ?? ""}
            onChange={(e) => setEmailColumn(e.target.value)}
            error={!emailColumn ? "Please select the email column" : undefined}
          >
            <option value="">Select email column</option>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </Select>
        </div>
      )}
      
      {parsedContacts.length > 0 && (
        <div>
          <h3 id="preview-heading" className="text-sm font-medium text-gray-700">
            Preview ({parsedContacts.length} contacts)
          </h3>
          <div aria-labelledby="preview-heading" className="mt-2 max-h-60 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        header === emailColumn ? "bg-blue-50" : ""
                      }`}
                    >
                      {header}
                      {header === emailColumn && " (Email)"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedContacts.slice(0, 5).map((contact, index) => (
                  <tr key={`row-${index}-${contact.email || Math.random().toString()}`}>
                    {headers.map((header) => (
                      <td
                        key={`cell-${index}-${header}`}
                        className={`px-3 py-2 whitespace-nowrap text-sm text-gray-500 ${
                          header === emailColumn ? "bg-blue-50" : ""
                        }`}
                      >
                        {String(contact[header] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
                {parsedContacts.length > 5 && (
                  <tr>
                    <td
                      colSpan={headers.length}
                      className="px-3 py-2 text-sm text-gray-500 text-center"
                    >
                      ... and {parsedContacts.length - 5} more contacts
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!emailColumn || parsedContacts.length === 0}
        >
          {stage === 'importing' ? 'Importing...' : 'Import Contacts'}
        </Button>
      </div>
    </form>
  );
}