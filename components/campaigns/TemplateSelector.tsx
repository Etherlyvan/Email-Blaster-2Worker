// components/campaigns/TemplateSelector.tsx
"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { TemplateSelectionModal } from "../templates/TemplateSelectionModal";
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface TemplateSelectorProps {
  readonly onSelectTemplateAction: (templateId: string, htmlContent: string) => void;
  readonly className?: string;
}

export function TemplateSelector({ onSelectTemplateAction, className = '' }: TemplateSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <div className={className}>
      <Button 
        type="button" 
        variant="secondary"
        onClick={() => setShowModal(true)}
        className="w-full sm:w-auto transition-all duration-200 hover:shadow-md"
        icon={<DocumentMagnifyingGlassIcon className="h-5 w-5 mr-2" />}
      >
        <span className="flex items-center">
          Browse Templates
          <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            Gallery
          </span>
        </span>
      </Button>
      
      <TemplateSelectionModal
        isOpen={showModal}
        onCloseAction={() => setShowModal(false)}
        onSelectAction={onSelectTemplateAction}
      />
    </div>
  );
}