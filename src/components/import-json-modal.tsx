"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Copy, Check } from "lucide-react";

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonText: string) => Promise<void>;
}

export function ImportJsonModal({
  isOpen,
  onClose,
  onImport,
}: ImportJsonModalProps) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setJsonText("");
      setError(null);
      setIsImporting(false);
      setCopied(false);
    }
  }, [isOpen]);

  // Copy schema template to clipboard
  const handleCopySchema = async () => {
    const schema = [
      {
        name: "Contact Name (required)",
        status: "Prospect | Signed On | Archived",
        email: "email@example.com",
        phone: "555-1234",
        temperature: "Hot | Warm | Lukewarm | Cold",
        initial_touchpoint: "2024-01-15",
        last_touchpoint: "2024-01-20",
        next_follow_up: "2024-02-01",
        proposal_sent: false,
        brief: "Markdown text...",
        notes: "Markdown text...",
        referral_source: "Referrer name",
        referral_type: "Organic | BNI | Client | Family | Other",
        good_fit: "Yes | No | Maybe"
      }
    ];
    await navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Validate JSON on change
  const validateJson = (text: string): string | null => {
    if (!text.trim()) {
      return null; // Empty is not an error, just can't import
    }

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        return "Expected an array of contacts. Got: " + typeof parsed;
      }
      return null; // Valid
    } catch {
      return "Invalid JSON format. Please check your syntax.";
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    setError(validateJson(text));
  };

  const handleImport = async () => {
    // Final validation
    const validationError = validateJson(jsonText);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!jsonText.trim()) {
      setError("Please paste JSON data to import.");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      await onImport(jsonText);
      // Success - close modal (parent handles toast)
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import contacts.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      onClose();
    }
  };

  const isValid = jsonText.trim() && !error;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Contacts from JSON</DialogTitle>
          <DialogDescription className="flex items-center justify-between gap-2">
            <span>
              Paste your JSON array of contacts below. Unknown fields will be ignored,
              and contacts missing a name will be skipped.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySchema}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" />
                  Copy Schema
                </>
              )}
            </Button>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <Textarea
            value={jsonText}
            onChange={handleTextChange}
            placeholder={`Paste your JSON array of contacts here...

Example:
[
  {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "555-1234",
    "status": "Prospect",
    "temperature": "Warm"
  }
]`}
            className="flex-1 min-h-[350px] font-mono text-sm resize-none"
            disabled={isImporting}
          />

          {error && (
            <div className="flex items-start gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!isValid || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
