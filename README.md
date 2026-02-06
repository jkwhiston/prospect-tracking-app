# Prospect Tracking Tool

A professional prospect tracking application for tax firms built with Next.js, Tailwind CSS, shadcn/ui, and Supabase.

## Features

- **Dashboard with Tabs**: Track prospects across three stages - Prospects, Signed On, and Archived
- **Data Table**: Sortable and filterable table with columns for Name, Touchpoints, Temperature, Proposal Status, and more
- **Follow-up Alerts**: Color-coded dates (red for overdue, yellow for upcoming within 3 days)
- **Contact Management**: Full CRUD operations with detailed view/edit sheets
- **Markdown Support**: Brief and Notes fields support Markdown formatting
- **Copy Buttons**: Quick copy functionality for all text fields
- **JSON Import/Export**: Backup and restore your contacts data
- **Double-Confirm Delete**: Safety confirmation before permanent deletion
- **Dark Mode**: Professional dark theme by default

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Database**: Supabase
- **Icons**: Lucide React
- **Markdown**: react-markdown with remark-gfm

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project's SQL Editor and run the migration script located at `supabase/migrations/001_create_contacts_table.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The `contacts` table includes:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | Timestamp | Creation date |
| status | Text | 'Prospect', 'Signed On', or 'Archived' |
| name | Text | Contact name (required) |
| initial_touchpoint | Date | First contact date |
| last_touchpoint | Date | Most recent contact date |
| next_follow_up | Date | Next scheduled follow-up |
| temperature | Text | 'Hot', 'Warm', 'Lukewarm', or 'Cold' |
| proposal_sent | Boolean | Whether proposal was sent |
| brief | Text | Markdown-formatted brief |
| phone | Text | Phone number |
| email | Text | Email address |
| referral_source | Text | Who referred the contact |
| referral_type | Text | 'Organic', 'BNI', 'Client', 'Family', or 'Other' |
| good_fit | Text | 'Yes', 'No', or 'Maybe' |
| notes | Text | Markdown-formatted notes |

## Usage

### Managing Contacts

1. Click "Add Contact" to create a new prospect
2. Click on any row to view/edit contact details
3. Use the dropdown menu (⋯) for quick actions:
   - Mark as Signed On
   - Archive
   - Delete (requires double confirmation)

### Filtering & Search

- Use tabs to filter by status
- Search by name using the search bar
- Filter by Temperature, Proposal Status, or Referral Type

### Import/Export

1. Click the Settings icon (⚙️)
2. Select "Export JSON" to download all contacts
3. Select "Import JSON" to upload contacts from a JSON file

## API Routes

Optional API endpoints for server-side operations:

- `GET /api/contacts` - Fetch all contacts with optional filters
- `POST /api/contacts` - Create a new contact
- `PATCH /api/contacts/[id]` - Update a contact
- `DELETE /api/contacts/[id]` - Delete a contact
- `GET /api/export` - Export contacts as JSON file
- `POST /api/import` - Bulk import contacts from JSON

## License

MIT
