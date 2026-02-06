"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { Pencil, Eye, Save, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createBrowserClient } from "@/lib/supabase/browser";
import { formatPhoneNumber } from "@/lib/phone-formatter";
import type { Contact, ContactInsert } from "@/types/contact";
import {
  CONTACT_STATUSES,
  TEMPERATURES,
  REFERRAL_TYPES,
  GOOD_FIT_OPTIONS,
} from "@/types/contact";
import { useToast } from "@/hooks/use-toast";

interface ContactSheetProps {
  contact: Contact | null;
  isOpen: boolean;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_CONTACT: Partial<ContactInsert> = {
  name: "",
  status: "Prospect",
  initial_touchpoint: null,
  last_touchpoint: null,
  next_follow_up: null,
  temperature: null,
  proposal_sent: false,
  brief: "",
  phone: "",
  email: "",
  referral_source: "",
  referral_type: null,
  good_fit: null,
  notes: "",
};

export function ContactSheet({
  contact,
  isOpen,
  isNew,
  onClose,
  onSaved,
}: ContactSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ContactInsert>>(EMPTY_CONTACT);
  
  const { toast } = useToast();
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    if (isNew) {
      setFormData(EMPTY_CONTACT);
      setIsEditing(true);
    } else if (contact) {
      setFormData({
        name: contact.name,
        status: contact.status,
        initial_touchpoint: contact.initial_touchpoint,
        last_touchpoint: contact.last_touchpoint,
        next_follow_up: contact.next_follow_up,
        temperature: contact.temperature,
        proposal_sent: contact.proposal_sent,
        brief: contact.brief || "",
        phone: contact.phone || "",
        email: contact.email || "",
        referral_source: contact.referral_source || "",
        referral_type: contact.referral_type,
        good_fit: contact.good_fit,
        notes: contact.notes || "",
      });
      setIsEditing(false);
    }
  }, [contact, isNew]);

  const handleInputChange = (
    field: keyof ContactInsert,
    value: string | boolean | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isNew) {
        const { error } = await supabase.from("contacts").insert([formData as ContactInsert]);
        if (error) throw error;
        toast({
          title: "Contact Created",
          description: `${formData.name} has been added.`,
        });
      } else if (contact) {
        const { error } = await supabase
          .from("contacts")
          .update(formData)
          .eq("id", contact.id);
        if (error) throw error;
        toast({
          title: "Contact Updated",
          description: `${formData.name} has been updated.`,
        });
      }
      onSaved();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Failed to save contact.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>{isNew ? "New Contact" : formData.name}</span>
            {!isNew && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            {isNew
              ? "Add a new contact to your prospect list"
              : isEditing
              ? "Edit contact details"
              : "View contact details"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="name">Name *</Label>
              <CopyButton value={formData.name} label="Name" />
            </div>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter name"
              />
            ) : (
              <p className="text-sm">{formData.name || "—"}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            {isEditing ? (
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm">{formData.status || "—"}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email">Email</Label>
              <CopyButton value={formData.email} label="Email" />
            </div>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="email@example.com"
              />
            ) : (
              <p className="text-sm">{formData.email || "—"}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="phone">Phone</Label>
              <CopyButton value={formData.phone} label="Phone" />
            </div>
            {isEditing ? (
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(555) 123-4567"
              />
            ) : (
              <p className="text-sm">{formData.phone || "—"}</p>
            )}
          </div>

          {/* Initial Touchpoint */}
          <div className="space-y-2">
            <Label htmlFor="initial_touchpoint">Initial Touchpoint</Label>
            {isEditing ? (
              <Input
                id="initial_touchpoint"
                type="date"
                value={formData.initial_touchpoint || ""}
                onChange={(e) =>
                  handleInputChange("initial_touchpoint", e.target.value || null)
                }
              />
            ) : (
              <p className="text-sm">
                {formData.initial_touchpoint || "—"}
              </p>
            )}
          </div>

          {/* Last Touchpoint */}
          <div className="space-y-2">
            <Label htmlFor="last_touchpoint">Last Touchpoint</Label>
            {isEditing ? (
              <Input
                id="last_touchpoint"
                type="date"
                value={formData.last_touchpoint || ""}
                onChange={(e) =>
                  handleInputChange("last_touchpoint", e.target.value || null)
                }
              />
            ) : (
              <p className="text-sm">
                {formData.last_touchpoint || "—"}
              </p>
            )}
          </div>

          {/* Next Follow Up */}
          <div className="space-y-2">
            <Label htmlFor="next_follow_up">Next Follow Up</Label>
            {isEditing ? (
              <Input
                id="next_follow_up"
                type="date"
                value={formData.next_follow_up || ""}
                onChange={(e) =>
                  handleInputChange("next_follow_up", e.target.value || null)
                }
              />
            ) : (
              <p className="text-sm">
                {formData.next_follow_up || "—"}
              </p>
            )}
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <Label>Temperature</Label>
            {isEditing ? (
              <Select
                value={formData.temperature || "none"}
                onValueChange={(value) =>
                  handleInputChange("temperature", value === "none" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select temperature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {TEMPERATURES.map((temp) => (
                    <SelectItem key={temp} value={temp}>
                      {temp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm">{formData.temperature || "—"}</p>
            )}
          </div>

          {/* Proposal Sent */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="proposal_sent"
              checked={formData.proposal_sent || false}
              onCheckedChange={(checked) =>
                isEditing && handleInputChange("proposal_sent", !!checked)
              }
              disabled={!isEditing}
            />
            <Label htmlFor="proposal_sent" className="cursor-pointer">
              Proposal Sent
            </Label>
          </div>

          {/* Referral Source */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="referral_source">Referral Source</Label>
              <CopyButton value={formData.referral_source} label="Referral Source" />
            </div>
            {isEditing ? (
              <Input
                id="referral_source"
                value={formData.referral_source || ""}
                onChange={(e) =>
                  handleInputChange("referral_source", e.target.value)
                }
                placeholder="Who referred them?"
              />
            ) : (
              <p className="text-sm">{formData.referral_source || "—"}</p>
            )}
          </div>

          {/* Referral Type */}
          <div className="space-y-2">
            <Label>Referral Type</Label>
            {isEditing ? (
              <Select
                value={formData.referral_type || "none"}
                onValueChange={(value) =>
                  handleInputChange("referral_type", value === "none" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select referral type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {REFERRAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm">{formData.referral_type || "—"}</p>
            )}
          </div>

          {/* Good Fit */}
          <div className="space-y-2">
            <Label>Good Fit</Label>
            {isEditing ? (
              <Select
                value={formData.good_fit || "none"}
                onValueChange={(value) =>
                  handleInputChange("good_fit", value === "none" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Is this a good fit?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assessed</SelectItem>
                  {GOOD_FIT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm">{formData.good_fit || "—"}</p>
            )}
          </div>

          {/* Brief (Markdown) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="brief">Brief</Label>
              <CopyButton value={formData.brief} label="Brief" />
            </div>
            {isEditing ? (
              <Textarea
                id="brief"
                value={formData.brief || ""}
                onChange={(e) => handleInputChange("brief", e.target.value)}
                placeholder="Enter brief notes (Markdown supported)"
                rows={4}
              />
            ) : (
              <div className="prose prose-sm prose-invert max-w-none rounded-md border p-3 bg-muted/30">
                {formData.brief ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formData.brief}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">No brief added</p>
                )}
              </div>
            )}
          </div>

          {/* Notes (Markdown) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Notes</Label>
              <CopyButton value={formData.notes} label="Notes" />
            </div>
            {isEditing ? (
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Enter notes (Markdown supported)"
                rows={6}
              />
            ) : (
              <div className="prose prose-sm prose-invert max-w-none rounded-md border p-3 bg-muted/30">
                {formData.notes ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formData.notes}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">No notes added</p>
                )}
              </div>
            )}
          </div>

          {/* Save Button */}
          {isEditing && (
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Contact
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
