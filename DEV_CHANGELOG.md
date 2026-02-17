# Developer Changelog

This document tracks development changes for AI agents and developers working on this project.

---

## 2026-02-17: Phone Number Formatting & Creation Date Sorting

### Phone Number Auto-Format (Country Code Support)
- Updated `src/lib/phone-formatter.ts` to handle 11-digit US numbers with leading `1` or `+1`
- `formatPhoneNumber` now strips the country code before formatting, so `15039497307` and `+15039497307` both auto-format to `(503) 949-7307`
- `stripPhoneNumber` and `isValidPhoneNumber` also normalize 11-digit inputs
- All existing consumers (`contacts-table.tsx`, `contact-sheet.tsx`) benefit automatically

### Creation Date Sort Control
- Added "Creation Date - Newest / Oldest" dropdown to the filter bar in `dashboard-client.tsx`
- Placed after the Referrals filter, next to the search bar and other filters
- Defaults to "Creation Date - Newest" (`created_at desc`)
- Uses a `DropdownMenu` (not Select) so re-clicking the same option always re-applies the sort
- Increments a `sortResetKey` counter on each click, passed to `ContactsTable` to clear any active column sort

### Hidden "Date Added" Column
- Added a `created_at` column definition in `contacts-table.tsx` with sortable header ("Date Added")
- Hidden by default via `DEFAULT_COLUMN_VISIBILITY` (`created_at: false`)
- Can be toggled visible from the Columns dropdown
- Displays formatted date (e.g., "Feb 17, 2026")

### Sort Conflict Resolution
- `ContactsTable` accepts an `externalSortBy` (reset key) prop
- A `useEffect` clears the table's internal column sorting state whenever the creation date dropdown is used
- Prevents column header sorts (e.g., Name) from permanently overriding the creation date sort

---

## 2026-02-07: Password Protection & Table Layout Overhaul

### Site Authentication
- Added master password protection for the entire site
- `src/middleware.ts` - Next.js middleware protects all routes, redirects unauthenticated users to `/login`
- `src/app/login/page.tsx` - Login page with password form, lock icon, and error handling
- `src/app/api/auth/login/route.ts` - API route validates password against `MASTER_PASSWORD` env var
- Auth session stored in httpOnly cookie (`prospect-tracker-auth`), expires after 7 days
- Cookie is `secure` in production, `sameSite: lax`
- Public routes (no auth required): `/login`, `/api/auth/login`

### Full-Width Table Layout
- Removed `container max-w-screen-2xl` constraint from dashboard (`dashboard-client.tsx`)
- Replaced with `w-full` so the table stretches to fill the entire viewport
- Applied same change to header in `layout.tsx` for consistent alignment
- All 15 columns now visible when zoomed out without horizontal scrolling

### Sticky Name Column
- Name column stays pinned to the left edge when scrolling horizontally
- Header cell: `sticky left-0 z-20` with opaque `bg-zinc-700` background
- Body cells: `sticky left-0 z-10` with `bg-background` and `group-even:bg-muted` for zebra stripe matching
- Subtle drop shadow (`shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]`) on body cells as visual separator
- Removed `overflow-auto` from inner `Table` wrapper (`table.tsx`) so sticky positioning works correctly
- Added `group` class to `TableRow` for `group-even:` child targeting

### Scroll-Aware Name Header Highlight
- Name column header changes to a lighter background (`bg-zinc-500`) with `text-white` when scrolled
- Returns to normal `bg-zinc-700` when scroll position is back to 0
- Smooth 200ms CSS transition (`transition-colors duration-200`)
- Uses direct DOM manipulation (`classList.add/remove`) via refs for zero-lag response
- `scrollContainerRef` on the overflow container, `stickyHeaderRef` on the Name `<th>`
- `useEffect` depends on `[loading]` to attach listener after table renders

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
- `src/app/layout.tsx` - Root layout with full-width header and metadata
- `src/app/icon.svg` - Favicon (users/people icon)
- `src/app/login/page.tsx` - Password login page
- `src/app/api/auth/login/route.ts` - Login API route
- `src/middleware.ts` - Auth middleware protecting all routes
- `src/components/contacts-table.tsx` - Main table with inline editing, sticky Name column, scroll detection
- `src/components/dashboard-client.tsx` - Full-width dashboard with tabs and filters
- `src/components/markdown-modal.tsx` - Modal for viewing/editing Briefs and Notes
- `src/components/ui/table.tsx` - Base table components with styling (group rows, no inner overflow)
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

### Authentication Flow
1. Middleware checks for `prospect-tracker-auth` cookie on every request
2. If missing/invalid, redirects to `/login`
3. Login page POSTs password to `/api/auth/login`
4. API route compares against `MASTER_PASSWORD` env var
5. On success, sets httpOnly cookie (7-day expiry) and redirects to `/`

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `MASTER_PASSWORD` - Master password for site access (server-side only, not prefixed with NEXT_PUBLIC_)
