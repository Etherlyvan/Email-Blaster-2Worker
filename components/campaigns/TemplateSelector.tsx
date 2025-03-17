// components/campaigns/TemplateSelector.tsx
"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { TemplateSelectionModal } from "../templates/TemplateSelectionModal";

interface TemplateSelectorProps {
  readonly onSelectTemplateAction: (templateId: string, htmlContent: string) => void;
}

export function TemplateSelector({ onSelectTemplateAction }: TemplateSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <div>
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => setShowModal(true)}
      >
        Browse Templates
      </Button>
      
      <TemplateSelectionModal
        isOpen={showModal}
        onCloseAction={() => setShowModal(false)}
        onSelectAction={onSelectTemplateAction}
      />
    </div>
  );
}