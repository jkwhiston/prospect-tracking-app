"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  ArrowUpDown,
  UserCheck,
  Archive,
  Trash2,
  Loader2,
  Columns,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import { format, differenceInDays, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/phone-formatter";
import type { Contact, ContactStatus, Temperature, ReferralType, GoodFit } from "@/types/contact";
import { TEMPERATURES, REFERRAL_TYPES, GOOD_FIT_OPTIONS, CONTACT_STATUSES } from "@/types/contact";

interface ContactsTableProps {
  contacts: Contact[];
  loading: boolean;
  onEdit: (contact: Contact) => void;
  onStatusChange: (contact: Contact, newStatus: ContactStatus) => void;
  onDelete: (contact: Contact) => void;
  onFieldUpdate: (contactId: string, field: string, value: unknown) => Promise<void>;
  onViewMarkdown: (contact: Contact, field: "brief" | "notes") => void;
}

const COLUMN_VISIBILITY_KEY = "prospect-tracker-column-visibility";

function getFollowUpColor(dateString: string | null): string {
  if (!dateString) return "";
  
  const date = parseISO(dateString);
  if (!isValid(date)) return "";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysDiff = differenceInDays(date, today);
  
  if (daysDiff < 0) return "text-red-500 font-medium";
  if (daysDiff === 0) return "text-red-500 font-medium";
  if (daysDiff <= 3) return "text-yellow-500 font-medium";
  return "";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const date = parseISO(dateString);
  if (!isValid(date)) return "—";
  return format(date, "MMM d, yyyy");
}

function getTemperatureBadgeVariant(temperature: string | null): "hot" | "warm" | "lukewarm" | "cold" | "secondary" {
  switch (temperature) {
    case "Hot": return "hot";
    case "Warm": return "warm";
    case "Lukewarm": return "lukewarm";
    case "Cold": return "cold";
    default: return "secondary";
  }
}

// Inline editable text cell
function EditableTextCell({
  value,
  onSave,
  placeholder = "—",
  formatValue,
  className = "",
}: {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  placeholder?: string;
  formatValue?: (v: string) => string;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue !== (value || "")) {
      setIsSaving(true);
      try {
        await onSave(editValue || null);
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(formatValue ? formatValue(e.target.value) : e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-8 w-full min-w-[100px]"
          autoFocus
          disabled={isSaving}
        />
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer hover:bg-muted/50 px-2 py-1 rounded -mx-2 -my-1 min-h-[28px] flex items-center ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </div>
  );
}

// Copyable text cell with hover copy button
function CopyableTextCell({
  value,
  onSave,
  placeholder = "—",
  formatValue,
  className = "",
  copyLabel = "Value",
}: {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  placeholder?: string;
  formatValue?: (v: string) => string;
  className?: string;
  copyLabel?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div 
      className="flex items-center gap-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setCopied(false); }}
    >
      <EditableTextCell
        value={value}
        onSave={onSave}
        placeholder={placeholder}
        formatValue={formatValue}
        className={className}
      />
      {value && isHovered && (
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-muted transition-colors"
          title={`Copy ${copyLabel}`}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
}

// Inline editable date cell
function EditableDateCell({
  value,
  onSave,
  colorClass = "",
}: {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  colorClass?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue !== (value || "")) {
      setIsSaving(true);
      try {
        await onSave(editValue || null);
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-8 w-[130px]"
          autoFocus
          disabled={isSaving}
        />
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer hover:bg-muted/50 px-2 py-1 rounded -mx-2 -my-1 min-h-[28px] flex items-center ${colorClass}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {formatDate(value)}
    </div>
  );
}

// Inline editable select cell
function EditableSelectCell<T extends string>({
  value,
  options,
  onSave,
  placeholder = "Select...",
  renderValue,
}: {
  value: T | null;
  options: readonly T[];
  onSave: (value: T | null) => Promise<void>;
  placeholder?: string;
  renderValue?: (v: T | null) => React.ReactNode;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (newValue: string) => {
    const actualValue = newValue === "none" ? null : (newValue as T);
    if (actualValue !== value) {
      setIsSaving(true);
      try {
        await onSave(actualValue);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Select value={value || "none"} onValueChange={handleChange} disabled={isSaving}>
        <SelectTrigger className="h-8 w-auto border-0 bg-transparent hover:bg-muted/50">
          <SelectValue>
            {renderValue ? renderValue(value) : (value || <span className="text-muted-foreground">{placeholder}</span>)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {renderValue ? renderValue(option) : option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
}

// Inline editable checkbox
function EditableCheckbox({
  checked,
  onSave,
}: {
  checked: boolean;
  onSave: (value: boolean) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (newChecked: boolean) => {
    setIsSaving(true);
    try {
      await onSave(newChecked);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Checkbox
        checked={checked}
        onCheckedChange={handleChange}
        disabled={isSaving}
        className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
      />
      {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
    </div>
  );
}

// Icon-only cell for markdown fields
function MarkdownCell({
  value,
  onView,
}: {
  value: string | null;
  onView: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView();
  };
  
  return (
    <div 
      className="flex items-center justify-center cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors" 
      onClick={handleClick}
    >
      {value ? (
        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      ) : (
        <span className="text-muted-foreground hover:text-foreground">—</span>
      )}
    </div>
  );
}

export function ContactsTable({
  contacts,
  loading,
  onEdit,
  onStatusChange,
  onDelete,
  onFieldUpdate,
  onViewMarkdown,
}: ContactsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    contact: Contact | null;
    step: number;
  }>({ contact: null, step: 0 });

  // Scroll detection for sticky Name column highlight (direct DOM for zero-lag)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const header = stickyHeaderRef.current;
    if (!container || !header) return;

    const handleScroll = () => {
      if (container.scrollLeft > 0) {
        header.classList.add("sticky-header-scrolled");
        header.classList.remove("sticky-header-default");
      } else {
        header.classList.remove("sticky-header-scrolled");
        header.classList.add("sticky-header-default");
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loading]);

  // Load column visibility from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (saved) {
      try {
        setColumnVisibility(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse column visibility:", e);
      }
    }
  }, []);

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const handleDeleteClick = (contact: Contact) => {
    setDeleteConfirmation({ contact, step: 1 });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.step === 1) {
      setDeleteConfirmation((prev) => ({ ...prev, step: 2 }));
    } else if (deleteConfirmation.step === 2 && deleteConfirmation.contact) {
      onDelete(deleteConfirmation.contact);
      setDeleteConfirmation({ contact: null, step: 0 });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ contact: null, step: 0 });
  };

  const columns: ColumnDef<Contact>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <CopyableTextCell
            value={row.original.name}
            onSave={(value) => onFieldUpdate(row.original.id, "name", value)}
            placeholder="Enter name"
            className="font-bold"
            copyLabel="Name"
          />
        ),
      },
      {
        accessorKey: "last_touchpoint",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Last Touch
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <EditableDateCell
            value={row.original.last_touchpoint}
            onSave={(value) => onFieldUpdate(row.original.id, "last_touchpoint", value)}
          />
        ),
      },
      {
        accessorKey: "brief",
        header: "Briefs",
        cell: ({ row }) => (
          <MarkdownCell
            value={row.original.brief}
            onView={() => onViewMarkdown(row.original, "brief")}
          />
        ),
      },
      {
        accessorKey: "temperature",
        header: "Temp",
        cell: ({ row }) => (
          <EditableSelectCell
            value={row.original.temperature}
            options={TEMPERATURES}
            onSave={(value) => onFieldUpdate(row.original.id, "temperature", value)}
            placeholder="—"
            renderValue={(v) =>
              v ? (
                <Badge variant={getTemperatureBadgeVariant(v)}>{v}</Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <CopyableTextCell
            value={row.original.email}
            onSave={(value) => onFieldUpdate(row.original.id, "email", value)}
            placeholder="—"
            copyLabel="Email"
          />
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <CopyableTextCell
            value={row.original.phone}
            onSave={(value) => onFieldUpdate(row.original.id, "phone", value)}
            placeholder="—"
            formatValue={formatPhoneNumber}
            copyLabel="Phone"
          />
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <EditableSelectCell
            value={row.original.status}
            options={CONTACT_STATUSES}
            onSave={(value) => onFieldUpdate(row.original.id, "status", value)}
            placeholder="Select..."
          />
        ),
      },
      {
        accessorKey: "initial_touchpoint",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Initial Touch
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <EditableDateCell
            value={row.original.initial_touchpoint}
            onSave={(value) => onFieldUpdate(row.original.id, "initial_touchpoint", value)}
          />
        ),
      },
      {
        accessorKey: "next_follow_up",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Next Follow Up
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <EditableDateCell
            value={row.original.next_follow_up}
            onSave={(value) => onFieldUpdate(row.original.id, "next_follow_up", value)}
            colorClass={getFollowUpColor(row.original.next_follow_up)}
          />
        ),
      },
      {
        accessorKey: "proposal_sent",
        header: "Proposal?",
        cell: ({ row }) => (
          <EditableCheckbox
            checked={row.original.proposal_sent}
            onSave={(value) => onFieldUpdate(row.original.id, "proposal_sent", value)}
          />
        ),
      },
      {
        accessorKey: "referral_source",
        header: "Referral Source",
        cell: ({ row }) => (
          <EditableTextCell
            value={row.original.referral_source}
            onSave={(value) => onFieldUpdate(row.original.id, "referral_source", value)}
            placeholder="—"
          />
        ),
      },
      {
        accessorKey: "referral_type",
        header: "Referral Type",
        cell: ({ row }) => (
          <EditableSelectCell
            value={row.original.referral_type}
            options={REFERRAL_TYPES}
            onSave={(value) => onFieldUpdate(row.original.id, "referral_type", value)}
            placeholder="—"
            renderValue={(v) => {
              if (!v) return <span className="text-muted-foreground">—</span>;
              const colorClass =
                v === "BNI"
                  ? "text-red-500"
                  : v === "Organic"
                  ? "text-green-500"
                  : v === "Client"
                  ? "text-teal-500"
                  : v === "Family"
                  ? "text-purple-400"
                  : "";
              return <span className={colorClass}>{v}</span>;
            }}
          />
        ),
      },
      {
        accessorKey: "good_fit",
        header: "Good Fit",
        cell: ({ row }) => (
          <EditableSelectCell
            value={row.original.good_fit}
            options={GOOD_FIT_OPTIONS}
            onSave={(value) => onFieldUpdate(row.original.id, "good_fit", value)}
            placeholder="—"
            renderValue={(v) => {
              if (!v) return <span className="text-muted-foreground">—</span>;
              const colorClass =
                v === "Yes"
                  ? "text-green-500"
                  : v === "No"
                  ? "text-red-500"
                  : "text-yellow-500";
              return <span className={colorClass}>{v}</span>;
            }}
          />
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <MarkdownCell
            value={row.original.notes}
            onView={() => onViewMarkdown(row.original, "notes")}
          />
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const contact = row.original;
          const isProspect = contact.status === "Prospect";
          const isSignedOn = contact.status === "Signed On";

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isProspect && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(contact, "Signed On")}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Mark as Signed On
                  </DropdownMenuItem>
                )}
                {(isProspect || isSignedOn) && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(contact, "Archived")}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                )}
                {!isProspect && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(contact, "Prospect")}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Move to Prospects
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(contact)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onFieldUpdate, onStatusChange, onViewMarkdown]
  );

  const table = useReactTable({
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Column visibility toggle */}
      <div className="flex justify-end mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === "initial_touchpoint"
                      ? "Initial Touch"
                      : column.id === "last_touchpoint"
                      ? "Last Touch"
                      : column.id === "next_follow_up"
                      ? "Next Follow Up"
                      : column.id === "proposal_sent"
                      ? "Proposal"
                      : column.id === "referral_source"
                      ? "Referral Source"
                      : column.id === "referral_type"
                      ? "Referral Type"
                      : column.id === "good_fit"
                      ? "Good Fit"
                      : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={scrollContainerRef} className="rounded-md border overflow-auto max-h-[calc(100vh-280px)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    ref={header.column.id === "name" ? stickyHeaderRef : undefined}
                    className={cn(
                      "whitespace-nowrap sticky top-0",
                      header.column.id === "name"
                        ? "left-0 z-30 transition-colors duration-200 sticky-header-default"
                        : "z-20 bg-muted dark:bg-zinc-700"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "whitespace-nowrap",
                        cell.column.id === "name" &&
                          "sticky left-0 z-10 bg-background group-even:bg-muted shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.step > 0}
        onOpenChange={(open) => !open && handleDeleteCancel()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteConfirmation.step === 1
                ? "Are you sure?"
                : "Are you REALLY sure?"}
            </DialogTitle>
            <DialogDescription>
              {deleteConfirmation.step === 1
                ? `You are about to delete "${deleteConfirmation.contact?.name}". This action cannot be undone.`
                : "This is your final warning. This contact will be permanently deleted from the database."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {deleteConfirmation.step === 1
                ? "Yes, delete"
                : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
