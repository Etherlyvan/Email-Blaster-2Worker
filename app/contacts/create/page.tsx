// app/contacts/create/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import axios from "axios";
import {useState, useEffect } from "react";

interface ContactGroup {
  id: string;
  name: string;
}

export default function CreateContactPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [additionalData, setAdditionalData] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await axios.get("/api/groups");
        setGroups(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setIsLoading(false);
      }
    }

    fetchGroups();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // Parse additional data
      let parsedAdditionalData = {};
      if (additionalData) {
        // Parse as key-value pairs, one per line: key=value
        const pairs = additionalData.split("\n");
        for (const pair of pairs) {
          const [key, value] = pair.split("=").map(s => s.trim());
          if (key && value) {
            parsedAdditionalData = { ...parsedAdditionalData, [key]: value };
          }
        }
      }
      
      await axios.post("/api/contacts", {
        email,
        additionalData: parsedAdditionalData,
        groupIds: selectedGroupIds,
      });
      
      router.push("/contacts");
    } catch (error) {
      console.error("Error creating contact:", error);
      setError("Failed to create contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGroupSelection(e: React.ChangeEvent<HTMLSelectElement>) {
    const options = Array.from(e.target.options);
    const selectedOptions = options.filter(option => option.selected);
    const values = selectedOptions.map(option => option.value);
    setSelectedGroupIds(values);
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Add Contact</h1>
      
      <Card>
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="contact@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="additionalData" className="block text-sm font-medium text-gray-700">
                Additional Data (one parameter per line, format: key=value)
              </label>
              <textarea
                id="additionalData"
                value={additionalData}
                onChange={(e) => setAdditionalData(e.target.value)}
                rows={5}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="name=John Doe
company=ACME Inc.
role=Manager"
              ></textarea>
              <p className="mt-1 text-sm text-gray-500">
                These parameters can be used in email templates with {'{{'} parameter {'}}' } syntax.
              </p>
            </div>
            
            <div>
              <label htmlFor="groupIds" className="block text-sm font-medium text-gray-700">
                Groups
              </label>
              <select
                id="groupIds"
                multiple
                value={selectedGroupIds}
                onChange={handleGroupSelection}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                size={Math.min(5, groups.length || 1)}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Hold Ctrl (or Cmd) to select multiple groups.
              </p>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Link href="/contacts">
                <Button variant="danger" type="button">Cancel</Button>
              </Link>
              <Button type="submit" loading={isSubmitting}>Create Contact</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}