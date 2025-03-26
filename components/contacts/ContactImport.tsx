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
import { 
  ArrowUpTrayIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
  ArrowPathIcon,
  TableCellsIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const importSchema = z.object({
  groupIds: z.array(z.string()).min(1, "Select at least one group"),
  file: z.any().refine((file) => file instanceof File, "File is required"),
});

type ImportFormData = z.infer<typeof importSchema>;
type ContactFieldValue = string | number | boolean | null;

interface Contact {
  email: string;
  [key: string]: ContactFieldValue;
}

interface ExcelRowData {
  [key: string]: ContactFieldValue;
}

interface ContactWithAdditionalData {
  email: string;
  additionalData: Record<string, string | number | boolean | null>;
}

type ImportStage = 'upload' | 'mapping' | 'review' | 'importing' | 'complete';

interface ImportStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
}

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
  const [importStats, setImportStats] = useState<ImportStats>({
    total: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      groupIds: [],
    },
  });
  
  const selectedGroupIds = watch('groupIds');
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setValue("file", file);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRowData>(firstSheet);
        
        if (jsonData.length === 0) {
          setError("No data found in the file");
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
        
        // Calculate initial stats
        const stats = {
          total: typedContacts.length,
          valid: 0,
          invalid: 0,
          duplicates: 0
        };
        
        // Check for valid emails
        const emailSet = new Set<string>();
        typedContacts.forEach(contact => {
          const email = emailColumnGuess ? String(contact[emailColumnGuess]).trim() : '';
          if (!email || !isValidEmail(email)) {
            stats.invalid++;
          } else if (emailSet.has(email.toLowerCase())) {
            stats.duplicates++;
          } else {
            stats.valid++;
            emailSet.add(email.toLowerCase());
          }
        });
        
        setImportStats(stats);
        setStage('mapping');
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        setError("Error parsing Excel file. Please make sure it's a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const handleColumnChange = (column: string) => {
    setEmailColumn(column);
    
    // Update stats based on new email column
    if (!column) return;
    
    const stats = {
      total: parsedContacts.length,
      valid: 0,
      invalid: 0,
      duplicates: 0
    };
    
    const emailSet = new Set<string>();
    parsedContacts.forEach(contact => {
      const email = String(contact[column]).trim();
      if (!email || !isValidEmail(email)) {
        stats.invalid++;
      } else if (emailSet.has(email.toLowerCase())) {
        stats.duplicates++;
      } else {
        stats.valid++;
        emailSet.add(email.toLowerCase());
      }
    });
    
    setImportStats(stats);
  };
  
  const handleReviewContacts = () => {
    if (!emailColumn) {
      setError("Please select an email column");
      return;
    }
    
    if (importStats.valid === 0) {
      setError("No valid email addresses found. Please check your data.");
      return;
    }
    
    setStage('review');
  };
  
  const handleFormSubmit = async (data: ImportFormData) => {
    if (!emailColumn || parsedContacts.length === 0) {
      setError("Please select an email column");
      return;
    }
    
    setIsSubmitting(true);
    setStage('importing');
    setError(null);
    
    try {
      // Map the contacts to the right format
      const formattedContacts: ContactWithAdditionalData[] = parsedContacts
        .map((contact) => {
          const email = String(contact[emailColumn]).trim();
          
          // Skip invalid emails
          if (!isValidEmail(email)) return null;
          
          const additionalData: Record<string, string | number | boolean | null> = {};
          
          // Add all other fields except the email column
          Object.entries(contact).forEach(([key, value]) => {
            if (key !== emailColumn) {
              additionalData[key] = value;
            }
          });
          
          return {
            email,
            additionalData,
          };
        })
        .filter((contact): contact is ContactWithAdditionalData => contact !== null);
      
      // Remove duplicates based on email
      const emailSet = new Set<string>();
      const uniqueContacts = formattedContacts.filter(contact => {
        const email = contact.email.toLowerCase();
        if (emailSet.has(email)) return false;
        emailSet.add(email);
        return true;
      });
      
      if (uniqueContacts.length === 0) {
        setError("No valid contacts to import");
        setStage('mapping');
        setIsSubmitting(false);
        return;
      }
      
      await onImportAction(uniqueContacts, data.groupIds);
      
      // Reset form and show success
      setStage('complete');
      
      // Update final stats
      setImportStats({
        ...importStats,
        valid: uniqueContacts.length
      });
    } catch (error) {
      console.error("Error importing contacts:", error);
      setError("Error importing contacts. Please try again.");
      setStage('review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetImport = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setParsedContacts([]);
    setHeaders([]);
    setEmailColumn(null);
    setStage('upload');
    setError(null);
    
    // Fix: Don't set file to undefined, use unregister instead
    control.unregister('file');
  };
  
  
  // Extract nested ternary operations into separate variables
  const stageClass1 = stage === 'mapping' ? 'bg-blue-500 text-white' : 
    (stage === 'review' || stage === 'importing' || stage === 'complete') ? 'bg-green-500 text-white' : 
    'bg-gray-200 text-gray-700';
    
  const stageClass2 = stage === 'review' || stage === 'importing' ? 'bg-blue-500 text-white' : 
    stage === 'complete' ? 'bg-green-500 text-white' : 
    'bg-gray-200 text-gray-700';
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <ArrowUpTrayIcon className="h-6 w-6 text-blue-500 mr-2" />
          Import Contacts
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Import contacts from Excel (.xlsx, .xls) or CSV files
        </p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="mb-8">
        <div className="relative">
          <div className="absolute left-0 inset-y-0 flex items-center h-12">
            <span className={`w-12 h-12 flex items-center justify-center rounded-full ${
              stage === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              1
            </span>
          </div>
          <div className={`ml-16 ${stage !== 'upload' ? 'opacity-60' : ''}`}>
            <h3 className="text-lg font-medium text-gray-900">Upload File</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select an Excel or CSV file containing your contacts
            </p>
            
            <div className={`${stage !== 'upload' ? 'pointer-events-none' : ''}`}>
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors duration-200">
                <div className="space-y-1 text-center">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Upload a file</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        accept=".xlsx,.xls,.csv"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={stage !== 'upload'}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Excel or CSV files up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-12 ml-6 border-l-2 border-gray-200"></div>
        
        <div className="relative">
          <div className="absolute left-0 inset-y-0 flex items-center h-12">
            <span className={`w-12 h-12 flex items-center justify-center rounded-full ${stageClass1}`}>
              2
            </span>
          </div>
          <div className={`ml-16 ${stage === 'upload' ? 'opacity-60' : ''}`}>
            <h3 className="text-lg font-medium text-gray-900">Map Columns</h3>
            <p className="text-sm text-gray-500 mb-4">
              Identify which column contains email addresses
            </p>
            
            {stage !== 'upload' && headers.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-4">
                  <TableCellsIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm font-medium">Column Mapping</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emailColumn" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Column *
                    </label>
                    <select
                      id="emailColumn"
                      value={emailColumn ?? ""}
                      onChange={(e) => handleColumnChange(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={stage !== 'mapping'}
                    >
                      <option value="">Select email column</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="groupIds" className="block text-sm font-medium text-gray-700 mb-1">
                      Target Groups *
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
                          disabled={stage !== 'mapping'}
                        >
                          {contactGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Hold Ctrl/Cmd to select multiple groups
                    </p>
                  </div>
                </div>
                
                {emailColumn && (
                  <div className="mt-4 bg-white rounded-md border border-gray-200 p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Data Preview</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="font-medium text-gray-700">Valid emails</div>
                      <div className="font-medium text-gray-700">Invalid emails</div>
                      <div className="font-medium text-gray-700">Duplicates</div>
                      
                      <div className="text-green-600 font-bold">{importStats.valid}</div>
                      <div className="text-red-600 font-bold">{importStats.invalid}</div>
                      <div className="text-amber-600 font-bold">{importStats.duplicates}</div>
                    </div>
                    
                    {importStats.invalid > 0 && (
                      <p className="mt-2 text-xs text-red-600">
                        <ExclamationCircleIcon className="inline-block h-4 w-4 mr-1" />
                        Invalid emails will be skipped during import
                      </p>
                    )}
                  </div>
                )}
                
                {stage === 'mapping' && (
                  <div className="mt-4 flex justify-between">
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={resetImport}
                      icon={<ArrowPathIcon className="h-4 w-4 mr-1.5" />}
                    >
                      Start Over
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleReviewContacts}
                      disabled={!emailColumn || selectedGroupIds.length === 0}
                      icon={<ArrowRightIcon className="h-4 w-4 mr-1.5" />}
                    >
                      Continue
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="h-12 ml-6 border-l-2 border-gray-200"></div>
        
        <div className="relative">
          <div className="absolute left-0 inset-y-0 flex items-center h-12">
            <span className={`w-12 h-12 flex items-center justify-center rounded-full ${stageClass2}`}>
              3
            </span>
          </div>
          <div className={`ml-16 ${stage === 'upload' || stage === 'mapping' ? 'opacity-60' : ''}`}>
            <h3 className="text-lg font-medium text-gray-900">Review & Import</h3>
            <p className="text-sm text-gray-500 mb-4">
              Verify your data and complete the import
            </p>
            
            {(stage === 'review' || stage === 'importing') && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Import Summary</h4>
                  <div className="bg-white rounded-md border border-gray-200 p-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total records:</span>
                        <span className="ml-2 font-medium">{importStats.total}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Valid emails:</span>
                        <span className="ml-2 font-medium text-green-600">{importStats.valid}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Invalid emails:</span>
                        <span className="ml-2 font-medium text-red-600">{importStats.invalid}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duplicates:</span>
                        <span className="ml-2 font-medium text-amber-600">{importStats.duplicates}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Target groups:</span>
                        <span className="ml-2">
                          {selectedGroupIds.map(id => {
                            const group = contactGroups.find(g => g.id === id);
                            return group ? group.name : '';
                          }).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Data</h4>
                  <div className="bg-white rounded-md border border-gray-200 p-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            Email
                          </th>
                          {headers
                            .filter(header => header !== emailColumn)
                            .slice(0, 3)
                            .map(header => (
                              <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                {header}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedContacts
                          .filter(contact => isValidEmail(String(contact[emailColumn ?? ''])))
                          .slice(0, 5)
                          .map((contact, idx) => (
                            <tr key={`sample-row-${idx}`} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {String(contact[emailColumn ?? ''])}
                              </td>
                              {headers
                                .filter(header => header !== emailColumn)
                                .slice(0, 3)
                                .map(header => (
                                  <td key={`${idx}-${header}`} className="px-4 py-2 text-sm text-gray-500">
                                    {String(contact[header] ?? '')}
                                  </td>
                                ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    
                    {parsedContacts.filter(contact => isValidEmail(String(contact[emailColumn ?? '']))).length > 5 && (
                      <p className="mt-2 text-xs text-gray-500 text-center">
                        Showing 5 of {parsedContacts.filter(contact => isValidEmail(String(contact[emailColumn ?? '']))).length} contacts
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => setStage('mapping')}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmit(handleFormSubmit)}
                    loading={isSubmitting}
                    icon={<ArrowUpTrayIcon className="h-4 w-4 mr-1.5" />}
                  >
                    Import Contacts
                  </Button>
                </div>
              </div>
            )}
            
            {stage === 'complete' && (
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-green-800 mb-2">Import Successful!</h3>
                <p className="text-green-700 mb-4">
                  Successfully imported {importStats.valid} contacts to your selected groups.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline-primary" 
                    onClick={resetImport}
                    icon={<ArrowPathIcon className="h-4 w-4 mr-1.5" />}
                  >
                    Import More
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => window.location.href = '/contacts'}
                  >
                    View Contacts
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <QuestionMarkCircleIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Tips for importing contacts</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>Make sure your file has a header row with column names</li>
                <li>One column must contain email addresses</li>
                <li>Other columns will be imported as additional contact data</li>
                <li>Duplicates are automatically handled (only the first occurrence is imported)</li>
                <li>For best results, clean your data before importing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}