# Developer Changelog

This document tracks development changes for AI agents and developers working on this project.

---

## 2026-02-06: UI/UX Improvements

### Table Styling
- **Column header styling**: Solid grey background (`bg-zinc-700`) with light text (`text-zinc-100`) for better differentiation
- **Alternating row colors**: Added `even:bg-muted/40` to TableRow for zebra striping
- **Column separators**: Added faint vertical borders between columns (`border-r border-border/30`)

### Column Changes
- Renamed "Brief" → "Briefs"
- Renamed "Follow Up" → "Next Follow Up"
- Reordered columns: Name → Last Touch → Briefs → Temp → Email → Phone → Status → Initial Touch → Next Follow Up → Proposal → Referral Source → Referral Type → Good Fit → Notes → Actions

### Dropdown Improvements
- Removed dropdown arrows from Select components for slimmer columns
- Changed SelectTrigger width from `w-[120px]` to `w-auto`
- Reduced date input width from `w-[140px]` to `w-[130px]`

### Referral Type Colors
- BNI = red (`text-red-500`)
- Organic = green (`text-green-500`)
- Client = teal (`text-teal-500`)
- Family = light purple (`text-purple-400`)
- Other = default

### Briefs/Notes Cells
- Changed from truncated text + eye icon to icon-only display
- Shows eye icon if content exists, dash if empty
- Both are clickable to open modal

### Prospect Names
- Changed from `font-medium` to `font-bold`

### Proposal Checkbox
- Checked state now shows red (`bg-red-500`)

### Markdown Modal (Briefs/Notes)
- Added contact name to modal title (e.g., "Brief — John Smith")
- Fixed UX issues:
  - No longer reverts to display mode after each auto-save
  - Clicking outside textarea switches to display mode (modal stays open)
  - User closes modal explicitly with X button
- Click-to-edit functionality with auto-save (1 second debounce)
- Updated description text: "Changes save automatically"

### Status Column
- NULL status contacts now appear in Prospects tab
- Changed placeholder from "Status" to "Select..." to prevent confusion

### Favicon
- Added SVG favicon (`src/app/icon.svg`) with users/people icon
- White icon on blue background (`#3b82f6`)
- File size: 514 bytes
- Added icon metadata to `layout.tsx`

---

## Architecture Notes

### Key Files
- `src/app/layout.tsx` - Root layout with header and metadata
- `src/app/icon.svg` - Favicon (users/people icon)
- `src/components/contacts-table.tsx` - Main table with inline editing
- `src/components/dashboard-client.tsx` - Dashboard with tabs and filters
- `src/components/markdown-modal.tsx` - Modal for viewing/editing Briefs and Notes
- `src/components/ui/table.tsx` - Base table components with styling
- `src/components/ui/select.tsx` - Dropdown select component

### Inline Editing Components
- `EditableTextCell` - Text fields with click-to-edit
- `EditableDateCell` - Date picker with click-to-edit
- `EditableSelectCell` - Dropdown with immediate save
- `EditableCheckbox` - Checkbox with immediate save
- `MarkdownCell` - Icon-only cell that opens markdown modal

### Data Flow
1. `DashboardClient` fetches contacts from Supabase
2. Contacts filtered by status tab and search/filters
3. `ContactsTable` renders with inline editing
4. Field updates call `onFieldUpdate` → Supabase update → local state update
5. Markdown fields open `MarkdownModal` for viewing/editing

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
