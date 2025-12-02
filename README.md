# Restaurant Queue Admin System

A beautiful, mobile-friendly queue and table management system for restaurants built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Queue Management
- ✅ Real-time queue tracking
- ✅ Token-based customer management
- ✅ Status tracking (Waiting → Called → Seated → Done)
- ✅ Service-based filtering (Lunch/Dinner)
- ✅ Customer information (name, phone, party size)
- ✅ Queue statistics and analytics
- ✅ Mobile-responsive design

### Table Management (NEW!)
- ✅ Add, edit, and delete tables
- ✅ Set table capacity
- ✅ Track table status (Available/Occupied/Reserved)
- ✅ Assign seated customers to tables
- ✅ Release tables when customers leave
- ✅ Real-time table updates
- ✅ Table capacity analytics
- ✅ Beautiful card-based layout

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Build Tool**: Vite

## Setup Instructions

### 1. Database Setup

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Located in: database/migration_restaurant_tables.sql
-- This creates the restaurant_tables table with all necessary constraints and indexes
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

Update `src/lib/supabaseClient.ts` with your Supabase credentials:

```typescript
const SUPABASE_URL = "your-project-url";
const SUPABASE_KEY = "your-anon-key";
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
npm run preview
```

## Database Schema

### queue_tokens table (existing)
```sql
- id: UUID
- org_id: TEXT
- token_number: INTEGER
- name: TEXT
- phone: TEXT
- people_count: INTEGER
- status: TEXT (waiting, called, seated, done, cancelled)
- service_date: DATE
- service_tag: TEXT
- created_at: TIMESTAMPTZ
- called_at: TIMESTAMPTZ
- seated_at: TIMESTAMPTZ
- done_at: TIMESTAMPTZ
```

### restaurant_tables table (new)
```sql
- id: UUID (primary key)
- org_id: TEXT
- table_number: TEXT
- capacity: INTEGER
- status: TEXT (available, occupied, reserved)
- current_token_id: UUID (foreign key to queue_tokens)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Usage

### Queue Tab

1. **View Queue**: See all active tokens for the selected service
2. **Call Customer**: Notify waiting customers
3. **Seat Customer**: Mark customer as seated
4. **Complete Service**: Mark customer as done
5. **Cancel Token**: Cancel a customer's reservation

### Tables Tab

1. **Add Table**: Click "Add Table" to create a new table
   - Enter table number (e.g., T1, A1, 101)
   - Set seating capacity
   
2. **Assign Customer**: 
   - Click "Assign" on an available table
   - Select a seated customer from the dropdown
   - Customer is automatically assigned to the table
   
3. **Release Table**: 
   - Click "Release" when customer leaves
   - Table becomes available for next customer
   
4. **Edit Table**: 
   - Click edit icon to modify table number or capacity
   
5. **Delete Table**: 
   - Click delete icon to remove table (with confirmation)

## URL Parameters

- `?org=<organization-id>` - Set organization ID
- `?svc=<service-tag>` - Set service type (lunch/dinner)

Example: `http://localhost:5173/?org=MyRestaurant&svc=dinner`

## Features in Detail

### Real-time Updates
Both queue and tables use Supabase real-time subscriptions for instant updates across all connected clients.

### Mobile-Friendly Design
- Responsive grid layouts
- Touch-friendly buttons
- Optimized for small screens
- Modal dialogs for forms

### Data Validation
- Table numbers must be unique per organization
- Capacity must be positive
- Only seated customers can be assigned to tables
- Tables can only be released if occupied

## Project Structure

```
src/
├── components/
│   ├── AddTableForm.tsx       # Add new table modal
│   ├── EmptyState.tsx          # Empty state UI
│   ├── Header.tsx              # App header
│   ├── LoadingState.tsx        # Loading spinner
│   ├── QueueArea.tsx           # Queue container
│   ├── QueueList.tsx           # Queue items list
│   ├── StatCard.tsx            # Statistics card
│   ├── StatsPanel.tsx          # Statistics panel
│   ├── StatusBadge.tsx         # Status indicator
│   ├── TableList.tsx           # Tables grid with CRUD
│   └── TablesTab.tsx           # Tables tab container
├── hooks/
│   ├── useQueue.ts             # Queue management hook
│   └── useTables.ts            # Table management hook
├── lib/
│   └── supabaseClient.ts       # Supabase configuration
├── types/
│   ├── queue.ts                # Queue type definitions
│   ├── status.ts               # Status type
│   └── table.ts                # Table type definitions
├── App.tsx                     # Main app with tabs
├── main.tsx                    # App entry point
└── index.css                   # Tailwind imports
```

## Customization

### Adding New Table Statuses
Edit `src/types/table.ts`:
```typescript
status: "available" | "occupied" | "reserved" | "maintenance"
```

### Changing Color Themes
Update Tailwind classes in components or modify `tailwind.config.js`

### Adding Custom Validations
Update the respective hooks (`useQueue.ts`, `useTables.ts`)

## Troubleshooting

### Tables not loading?
1. Check Supabase connection in browser console
2. Verify SQL migration was run successfully
3. Check Row Level Security policies

### Real-time not working?
1. Ensure Supabase real-time is enabled for the table
2. Check browser console for subscription errors
3. Verify Supabase project limits

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
