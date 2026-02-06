"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsTable } from "@/components/contacts-table";
import { ContactSheet } from "@/components/contact-sheet";
import { MarkdownModal } from "@/components/markdown-modal";
import { ImportJsonModal } from "@/components/import-json-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Download, Upload, Settings, Search } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { Contact, ContactInsert, ContactStatus, Temperature, ReferralType, GoodFit } from "@/types/contact";
import { TEMPERATURES, REFERRAL_TYPES, CONTACT_STATUSES, GOOD_FIT_OPTIONS } from "@/types/contact";
import { useToast } from "@/hooks/use-toast";

export function DashboardClient() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContactStatus | "All">("Prospect");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isNewContact, setIsNewContact] = useState(false);
  
  // Markdown modal state
  const [markdownModal, setMarkdownModal] = useState<{
    isOpen: boolean;
    contact: Contact | null;
    field: "brief" | "notes";
  }>({ isOpen: false, contact: null, field: "brief" });
  
  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [temperatureFilter, setTemperatureFilter] = useState<Temperature | "all">("all");
  const [proposalFilter, setProposalFilter] = useState<"all" | "yes" | "no">("all");
  const [referralTypeFilter, setReferralTypeFilter] = useState<ReferralType | "all">("all");
  
  const { toast } = useToast();
  const supabase = useMemo(() => createBrowserClient(), []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load contacts. Please check your Supabase connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Filter contacts by status and other criteria
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Status filter (from tab)
      // Skip status filtering for "All" tab
      if (activeTab !== "All") {
        // NULL status contacts should appear in Prospect tab
        if (activeTab === "Prospect") {
          if (contact.status !== "Prospect" && contact.status !== null) return false;
        } else {
          if (contact.status !== activeTab) return false;
        }
      }
      
      // Search filter
      if (searchQuery && !contact.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Temperature filter
      if (temperatureFilter !== "all" && contact.temperature !== temperatureFilter) {
        return false;
      }
      
      // Proposal sent filter
      if (proposalFilter === "yes" && !contact.proposal_sent) return false;
      if (proposalFilter === "no" && contact.proposal_sent) return false;
      
      // Referral type filter
      if (referralTypeFilter !== "all" && contact.referral_type !== referralTypeFilter) {
        return false;
      }
      
      return true;
    });
  }, [contacts, activeTab, searchQuery, temperatureFilter, proposalFilter, referralTypeFilter]);

  const handleAddContact = () => {
    setSelectedContact(null);
    setIsNewContact(true);
    setIsSheetOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsNewContact(false);
    setIsSheetOpen(true);
  };

  const handleContactSaved = () => {
    fetchContacts();
    setIsSheetOpen(false);
    setSelectedContact(null);
  };

  const handleStatusChange = async (contact: Contact, newStatus: ContactStatus) => {
    try {
      const { error } = await supabase
        .from("contacts")
        .update({ status: newStatus })
        .eq("id", contact.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `${contact.name} has been moved to ${newStatus}.`,
      });

      fetchContacts();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update contact status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contact.id);

      if (error) throw error;

      toast({
        title: "Contact Deleted",
        description: `${contact.name} has been permanently deleted.`,
      });

      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "Failed to delete contact.",
        variant: "destructive",
      });
    }
  };

  // Inline field update handler
  const handleFieldUpdate = async (contactId: string, field: string, value: unknown) => {
    try {
      const { error } = await supabase
        .from("contacts")
        .update({ [field]: value })
        .eq("id", contactId);

      if (error) throw error;

      // Update local state optimistically
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId ? { ...c, [field]: value } : c
        )
      );

      toast({
        title: "Updated",
        description: "Field updated successfully.",
      });
    } catch (error) {
      console.error("Error updating field:", error);
      toast({
        title: "Error",
        description: "Failed to update field.",
        variant: "destructive",
      });
      // Refetch to revert optimistic update
      fetchContacts();
    }
  };

  // View markdown modal handler
  const handleViewMarkdown = (contact: Contact, field: "brief" | "notes") => {
    setMarkdownModal({ isOpen: true, contact, field });
  };

  // Save markdown from modal
  const handleSaveMarkdown = async (value: string) => {
    if (!markdownModal.contact) return;
    
    try {
      const { error } = await supabase
        .from("contacts")
        .update({ [markdownModal.field]: value })
        .eq("id", markdownModal.contact.id);

      if (error) throw error;

      // Update local state
      setContacts((prev) =>
        prev.map((c) =>
          c.id === markdownModal.contact!.id
            ? { ...c, [markdownModal.field]: value }
            : c
        )
      );

      // Update modal contact state
      setMarkdownModal((prev) => ({
        ...prev,
        contact: prev.contact
          ? { ...prev.contact, [markdownModal.field]: value }
          : null,
      }));

      toast({
        title: "Saved",
        description: `${markdownModal.field === "brief" ? "Brief" : "Notes"} updated successfully.`,
      });
    } catch (error) {
      console.error("Error saving markdown:", error);
      toast({
        title: "Error",
        description: "Failed to save content.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contacts-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${data?.length || 0} contacts.`,
      });
    } catch (error) {
      console.error("Error exporting contacts:", error);
      toast({
        title: "Error",
        description: "Failed to export contacts.",
        variant: "destructive",
      });
    }
  };

  // Helper function to normalize a contact for import (tolerant to missing/extra fields)
  const normalizeContactForImport = (contact: Record<string, unknown>): ContactInsert | null => {
    // Valid fields for ContactInsert (excluding id and created_at which are auto-generated)
    const validStatuses: ContactStatus[] = CONTACT_STATUSES;
    const validTemperatures: Temperature[] = TEMPERATURES;
    const validReferralTypes: ReferralType[] = REFERRAL_TYPES;
    const validGoodFitOptions: GoodFit[] = GOOD_FIT_OPTIONS;

    // Helper to convert empty strings to null
    const emptyToNull = (value: unknown): string | null => {
      if (value === null || value === undefined) return null;
      const str = String(value).trim();
      return str === "" ? null : str;
    };

    // Helper to convert to boolean
    const toBoolean = (value: unknown): boolean => {
      if (value === true || value === "true" || value === 1 || value === "1") return true;
      return false;
    };

    // Helper to validate enum values
    const validateEnum = <T extends string>(value: unknown, validValues: T[]): T | null => {
      if (value === null || value === undefined || value === "") return null;
      const str = String(value);
      return validValues.includes(str as T) ? (str as T) : null;
    };

    // Extract and validate name (required field)
    const name = emptyToNull(contact.name);
    if (!name) {
      // Name is required - skip this contact
      return null;
    }

    // Build the normalized contact object with only valid fields
    const normalized: ContactInsert = {
      name,
      status: validateEnum(contact.status, validStatuses) ?? undefined,
      initial_touchpoint: emptyToNull(contact.initial_touchpoint),
      last_touchpoint: emptyToNull(contact.last_touchpoint),
      next_follow_up: emptyToNull(contact.next_follow_up),
      temperature: validateEnum(contact.temperature, validTemperatures),
      proposal_sent: toBoolean(contact.proposal_sent),
      brief: emptyToNull(contact.brief),
      phone: emptyToNull(contact.phone),
      email: emptyToNull(contact.email),
      referral_source: emptyToNull(contact.referral_source),
      referral_type: validateEnum(contact.referral_type, validReferralTypes),
      good_fit: validateEnum(contact.good_fit, validGoodFitOptions),
      notes: emptyToNull(contact.notes),
    };

    return normalized;
  };

  // Handle import from pasted JSON text
  const handleImportFromText = async (jsonText: string) => {
    const importedContacts = JSON.parse(jsonText);

    if (!Array.isArray(importedContacts)) {
      throw new Error("Invalid JSON format. Expected an array of contacts.");
    }

    // Normalize each contact, filtering out invalid ones (missing name)
    const normalizedContacts: ContactInsert[] = [];
    let skippedCount = 0;

    for (const contact of importedContacts) {
      const normalized = normalizeContactForImport(contact as Record<string, unknown>);
      if (normalized) {
        normalizedContacts.push(normalized);
      } else {
        skippedCount++;
      }
    }

    if (normalizedContacts.length === 0) {
      throw new Error("No valid contacts to import. All contacts were missing required fields.");
    }

    const { error } = await supabase
      .from("contacts")
      .insert(normalizedContacts);

    if (error) throw error;

    // Build toast message
    let description = `Successfully imported ${normalizedContacts.length} contact${normalizedContacts.length === 1 ? "" : "s"}.`;
    if (skippedCount > 0) {
      description += ` ${skippedCount} contact${skippedCount === 1 ? " was" : "s were"} skipped (missing name).`;
    }

    toast({
      title: "Import Complete",
      description,
    });

    fetchContacts();
  };

  return (
    <div className="container max-w-screen-2xl px-4 py-6">
      {/* Header with title and actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prospects Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track your tax firm prospects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddContact}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs for status filtering */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContactStatus | "All")}>
        <TabsList className="mb-4">
          <TabsTrigger value="Prospect">
            Prospects
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
              {contacts.filter((c) => c.status === "Prospect" || c.status === null).length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="Signed On">
            Signed On
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
              {contacts.filter((c) => c.status === "Signed On").length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="Archived">
            Archived
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
              {contacts.filter((c) => c.status === "Archived").length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="All">
            All
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
              {contacts.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select
              value={temperatureFilter}
              onValueChange={(value) => setTemperatureFilter(value as Temperature | "all")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Temperature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Temps</SelectItem>
                {TEMPERATURES.map((temp) => (
                  <SelectItem key={temp} value={temp}>
                    {temp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={proposalFilter}
              onValueChange={(value) => setProposalFilter(value as "all" | "yes" | "no")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Proposal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Proposal Status - All</SelectItem>
                <SelectItem value="yes">Sent</SelectItem>
                <SelectItem value="no">Not Sent</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={referralTypeFilter}
              onValueChange={(value) => setReferralTypeFilter(value as ReferralType | "all")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Referral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Referrals</SelectItem>
                {REFERRAL_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Counter - larger for easier reading */}
        <div className="mb-4 text-lg text-muted-foreground">
          Total {activeTab === "All" ? "Contacts" : activeTab === "Prospect" ? "Prospects" : activeTab}: {" "}
          <span className="font-bold text-foreground text-xl">{filteredContacts.length}</span>
        </div>

        {/* Table content */}
        <TabsContent value="Prospect" className="mt-0">
          <ContactsTable
            contacts={filteredContacts}
            loading={loading}
            onEdit={handleEditContact}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteContact}
            onFieldUpdate={handleFieldUpdate}
            onViewMarkdown={handleViewMarkdown}
          />
        </TabsContent>
        <TabsContent value="Signed On" className="mt-0">
          <ContactsTable
            contacts={filteredContacts}
            loading={loading}
            onEdit={handleEditContact}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteContact}
            onFieldUpdate={handleFieldUpdate}
            onViewMarkdown={handleViewMarkdown}
          />
        </TabsContent>
        <TabsContent value="Archived" className="mt-0">
          <ContactsTable
            contacts={filteredContacts}
            loading={loading}
            onEdit={handleEditContact}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteContact}
            onFieldUpdate={handleFieldUpdate}
            onViewMarkdown={handleViewMarkdown}
          />
        </TabsContent>
        <TabsContent value="All" className="mt-0">
          <ContactsTable
            contacts={filteredContacts}
            loading={loading}
            onEdit={handleEditContact}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteContact}
            onFieldUpdate={handleFieldUpdate}
            onViewMarkdown={handleViewMarkdown}
          />
        </TabsContent>
      </Tabs>

      {/* Contact Sheet */}
      <ContactSheet
        contact={selectedContact}
        isOpen={isSheetOpen}
        isNew={isNewContact}
        onClose={() => setIsSheetOpen(false)}
        onSaved={handleContactSaved}
      />

      {/* Markdown Modal for Brief/Notes */}
      <MarkdownModal
        isOpen={markdownModal.isOpen}
        onClose={() => setMarkdownModal({ isOpen: false, contact: null, field: "brief" })}
        title={markdownModal.field === "brief" ? "Brief" : "Notes"}
        contactName={markdownModal.contact?.name}
        value={markdownModal.contact?.[markdownModal.field] || null}
        onSave={handleSaveMarkdown}
      />

      {/* Import JSON Modal */}
      <ImportJsonModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportFromText}
      />
    </div>
  );
}
