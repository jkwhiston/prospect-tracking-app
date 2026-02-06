"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string | null;
  onSave: (value: string) => Promise<void>;
}

export function MarkdownModal({
  isOpen,
  onClose,
  title,
  value,
  onSave,
}: MarkdownModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setEditValue(value || "");
    setIsEditing(false);
  }, [value, isOpen]);

  // Auto-save with debouncing
  const handleAutoSave = async (newValue: string) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a timeout to save after 1 second of no changes
    saveTimeoutRef.current = setTimeout(async () => {
      if (newValue !== (value || "")) {
        setIsSaving(true);
        try {
          await onSave(newValue);
        } catch (error) {
          console.error("Error auto-saving:", error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    handleAutoSave(newValue);
  };

  const handleBlur = async () => {
    // Save immediately on blur if there are changes
    if (editValue !== (value || "")) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setIsSaving(true);
      try {
        await onSave(editValue);
      } catch (error) {
        console.error("Error saving on blur:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleClose = () => {
    // Save any pending changes before closing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (editValue !== (value || "")) {
      onSave(editValue);
    }
    setIsEditing(false);
    setEditValue(value || "");
    onClose();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{title}</span>
            <div className="flex items-center gap-2">
              <CopyButton value={editValue} label={title} />
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Click outside to save automatically" 
              : "Click the content below to edit (Markdown supported)"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-[200px]">
          {isEditing ? (
            <Textarea
              value={editValue}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={`Enter ${title.toLowerCase()}...`}
              className="min-h-[300px] font-mono text-sm"
              autoFocus
            />
          ) : (
            <div 
              className="prose prose-sm prose-invert max-w-none rounded-md border p-4 bg-muted/30 min-h-[200px] cursor-text hover:bg-muted/50 transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {editValue ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {editValue}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">Click to add content...</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
