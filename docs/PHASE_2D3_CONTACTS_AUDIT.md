# Phase 2D.3 — Contacts Audit

**Date**: 2026-08-04  
**Phase**: Pre-implementation audit  
**Status**: Complete

---

## 1. CONTACTS STRUCTURE AUDIT

### Routes
- `/contacts` - Main contacts list
- `/contacts/[id]` - Individual contact detail

### Components
- `apps/web/src/app/(dashboard)/contacts/page.tsx` - Main list view
- `apps/web/src/app/(dashboard)/contacts/[id]/page.tsx` - Detail view
- `apps/web/src/components/features/contacts/contact-drawer.tsx` - Create/Edit drawer

### Query Hooks (`apps/web/src/queries/contacts.queries.ts`)
- `useContacts(params)` - List with search/filter/pagination
- `useContact(id)` - Single contact with timeline
- `useContactTimeline(id)` - Activity timeline
- `useCreateContact()` - Create mutation
- `useUpdateContact(id)` - Update mutation
- `useDeleteContact()` - Delete mutation
- `useAddContactNote(contactId)` - Add note mutation
- `useMergeContacts()` - Merge contacts mutation

---

## 2. DATA STRUCTURE

### Contact Interface
```typescript
{
  id: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  status: string; // ACTIVE, ARCHIVED, BLOCKED
  source?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ tag: { id, name, color } }>;
}
```

### API Endpoints
- `GET /contacts` - List with params (search, limit, etc.)
- `GET /contacts/:id` - Single contact with timeline
- `POST /contacts` - Create
- `PATCH /contacts/:id` - Update
- `DELETE /contacts/:id` - Delete
- `POST /contacts/:id/notes` - Add note
- `POST /contacts/merge` - Merge contacts

### Response Format
```typescript
{
  data: Contact[];
  pagination: {
    hasNextPage: boolean;
    nextCursor: string | null;
    total: number;
  };
}
```

---

## 3. CURRENT IMPLEMENTATION ANALYSIS

### Page Header
**Current**:
```tsx
<PageHeader
  title="Contacts"
  description={`${total.toLocaleString()} total contacts`}
  actions={
    <>
      <Button variant="outline" size="sm" onClick={() => router.push('/contacts/import')}>
        <Upload className="h-4 w-4" /> Import
      </Button>
      <Button size="sm" onClick={() => { setEditContact(null); setDrawerOpen(true); }}>
        <Plus className="h-4 w-4" /> Add Contact
      </Button>
    </>
  }
/>
```

✅ **Assessment**: Good hierarchy, real data count, functional actions

### Search & Filters Section
**Current**:
- Search input with magnifying glass icon
- Debounced search (300ms)
- Filter button (icon only, no functionality)
- Export button (icon only, no functionality)

**Issues**:
- ❌ Filter button does nothing
- ❌ Export button does nothing
- ✅ Search works properly with API integration
- ✅ Debounce implemented correctly

### Bulk Actions Bar
**Current**:
- Shows when `selectedIds.size > 0`
- Displays count: "{n} selected"
- Merge button (no functionality)
- Delete button (no functionality)
- Clear selection button (works)

**Issues**:
- ❌ Merge not wired (despite `useMergeContacts()` hook existing!)
- ❌ Bulk delete not implemented
- ✅ Selection state works
- ✅ Clear works

### Contact Table
**Current**: Custom table markup (NOT using Phase 2C Table component)

**Structure**:
```
| Checkbox | Name (Avatar + Name/Email) | Phone | Company | Tags | Status | Added | Actions |
```

**Columns**:
1. Checkbox - Selection (works)
2. Name - Avatar, firstName + lastName, email below
3. Phone - formatPhoneDisplay() - hidden md:table-cell
4. Company - Building2 icon + text - hidden lg:table-cell
5. Tags - Colored badges, max 3 shown - hidden xl:table-cell
6. Status - Badge (success/muted/destructive) - hidden sm:table-cell
7. Added - formatDate(createdAt) - hidden xl:table-cell
8. Actions - Eye (view), Trash (delete) - always visible

**Responsive Behavior**:
- xl: All columns
- lg: Hide tags column
- md: Hide phone, tags
- sm: Hide phone, tags, status
- xs: Only checkbox, name, actions

✅ **Assessment**: Solid responsive strategy, proper progressive disclosure

### Row Actions
**Current**:
- **View**: `router.push(`/contacts/${contact.id}`)` ✅ Works
- **Delete**: Native `confirm()`, then `deleteContact.mutate(contact.id)` ✅ Works

**Missing**:
- No "Edit" button in row actions
- Must click row to view, then edit button in detail page

### Table Styling
**Colors**:
- ✅ Uses semantic tokens: `text-foreground`, `text-muted-foreground`, `bg-muted/30`, `border-border`
- ❌ **Tag colors**: `style={{ backgroundColor: ${tag.color}20, color: tag.color }}` - **VIOLATION**

**Layout**:
- ✅ Proper border radius `rounded-xl`
- ✅ Hover state: `hover:bg-muted/30 transition-colors`
- ✅ Border styling: `border border-border`

---

## 4. CONTACT DRAWER

### Current Implementation
**File**: `contact-drawer.tsx`

**Features**:
- Slide-in from right (`animate-slide-in-right`)
- Backdrop with blur
- Form with react-hook-form + zod validation
- Fields: firstName*, lastName, phone* (E.164), email, company, jobTitle, notes
- Create or Edit mode (based on contactId prop)
- Loads existing contact data in edit mode

**Validation**:
- firstName: Required, min 1 char
- phone: Required, min 7 chars, must start with `+` (E.164)
- email: Valid email or empty

**API Integration**:
- ✅ Uses `useCreateContact()` for creation
- ✅ Uses `useUpdateContact(id)` for editing
- ✅ Uses `useContact(id)` to load data
- ✅ Proper cache invalidation
- ✅ Toast feedback

**Assessment**: ✅ Excellent implementation, no changes needed

---

## 5. CONTACT DETAIL PAGE

### Current Implementation
**File**: `/contacts/[id]/page.tsx`

**Layout**: 2-column (1/3 + 2/3 split)

**Left Panel** (Profile Card):
- Large avatar
- Name, job title, company
- Status badge
- Contact info grid: Phone, Email, Company, Job Title, Added date
- Tags section with colored badges
- "Start Chat" button (creates/opens WhatsApp conversation)
- "Edit" button (opens drawer)

**Right Panel**:
- Add Note card (textarea + save button)
- Activity Timeline card (vertical timeline with dots)

**Issues Found**:
- ❌ **Tag colors**: `style={{ backgroundColor: ${tag.color}20, color: tag.color }}` - **VIOLATION**
- ✅ Back button uses router.back()
- ✅ Start Chat creates real conversation
- ✅ Timeline shows real events
- ✅ Notes are real (uses `useAddContactNote()`)

---

## 6. LOADING STATES

### Contacts List
```tsx
<ContactsTableSkeleton />
```

**Implementation**:
- 8 skeleton rows
- Mimics actual table structure
- Skeleton for checkbox, avatar, name, email, other columns

✅ **Assessment**: Good skeleton implementation

### Contact Detail
```tsx
<Skeleton className="h-8 w-48" />
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <Skeleton className="h-64 rounded-xl" />
  <div className="lg:col-span-2 space-y-4">
    {Array.from({ length: 4 }).map...}
  </div>
</div>
```

✅ **Assessment**: Appropriate skeleton structure

---

## 7. EMPTY STATES

### No Contacts
```tsx
<EmptyState
  icon={<Phone className="h-7 w-7" />}
  title={debouncedSearch ? 'No contacts found' : 'No contacts yet'}
  description={debouncedSearch ? 'Try adjusting your search.' : 'Start building your contact list.'}
  action={!debouncedSearch ? { label: 'Add first contact', onClick: ... } : undefined}
/>
```

✅ **Assessment**: Contextual empty states, good UX

### Contact Detail - No Activity
```tsx
<p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>
```

✅ **Assessment**: Simple and clear

---

## 8. ERROR STATES

### Current: **MISSING**
- No error boundaries
- Queries fail silently (React Query default)
- No retry mechanism shown in UI

⚠️ **Needs**: Error state when queries fail

---

## 9. SEARCH FUNCTIONALITY

### Implementation
```tsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);
const { data, isLoading } = useContacts({
  search: debouncedSearch || undefined,
  limit: 50,
});
```

**Search Fields** (backend determines):
- Likely: name, phone, email, company (mentioned in placeholder)

✅ **Assessment**: Proper debounce, clean implementation

---

## 10. BULK ACTIONS ANALYSIS

### Selection State
```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const toggleSelect = useCallback((id: string) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}, []);

const selectAll = () => setSelectedIds(new Set(contacts.map((c) => c.id)));
const clearSelection = () => setSelectedIds(new Set());
```

✅ **Assessment**: Proper Set usage, good performance

### Merge Contacts
**API Hook EXISTS**: `useMergeContacts()`

```typescript
export function useMergeContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ primaryId, duplicateId }: { primaryId: string; duplicateId: string }) =>
      apiClient.post('/contacts/merge', { primaryId, duplicateId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contacts merged successfully');
    },
    onError: () => toast.error('Failed to merge contacts'),
  });
}
```

**Current UI**: Merge button exists but does nothing

⚠️ **Decision Required**: 
1. Wire merge (need UI to select primary vs duplicate)
2. Remove button (defer to Phase 3)
3. Disable button with tooltip

### Bulk Delete
**API Hook EXISTS**: `useDeleteContact()` (single contact)

**Current**: Bulk delete button exists but does nothing

**Backend Support**: Unknown if batch delete endpoint exists

⚠️ **Decision Required**:
1. Implement as loop over `deleteContact.mutate()` for each ID
2. Check for batch endpoint
3. Remove button (defer)

---

## 11. FILTER FUNCTIONALITY

### Current UI
```tsx
<Button variant="outline" size="sm">
  <Filter className="h-4 w-4" /> Filter
</Button>
```

**Functionality**: ❌ **NONE** (button does nothing)

**Backend Support**: Contacts query accepts params object, likely supports filters

⚠️ **Decision Required**:
1. Implement filter panel (status, source, date range, tags)
2. Remove button (defer to Phase 3)
3. Disable with tooltip

---

## 12. EXPORT FUNCTIONALITY

### Current UI
```tsx
<Button variant="outline" size="sm">
  <Download className="h-4 w-4" /> Export
</Button>
```

**Functionality**: ❌ **NONE** (button does nothing)

**Backend Support**: Unknown if export endpoint exists

⚠️ **Decision Required**:
1. Check for export API, wire if exists
2. Remove button (defer to Phase 3)
3. Disable with tooltip

---

## 13. IMPORT FUNCTIONALITY

### Current UI
```tsx
<Button variant="outline" size="sm" onClick={() => router.push('/contacts/import')}>
  <Upload className="h-4 w-4" /> Import
</Button>
```

**Functionality**: Navigates to `/contacts/import`

⚠️ **Route Exists?**: Unknown - not verified in inventory

**Decision Required**: Verify route exists or handle gracefully

---

## 14. PAGINATION

### Current Implementation
```typescript
interface ContactsResponse {
  pagination: {
    hasNextPage: boolean;
    nextCursor: string | null;
    total: number;
  };
}
```

**UI**: ❌ **No pagination controls visible in current implementation**

**Backend**: Supports cursor-based pagination

⚠️ **Issue**: Backend returns pagination data, but UI doesn't show controls

**Needs**: Pagination controls (Next/Previous) or infinite scroll

---

## 15. SORTING

### Current: **NOT IMPLEMENTED**

No visible sort controls, no sort state

**Backend Support**: Unknown

**Recommendation**: Defer to Phase 3 unless trivial

---

## 16. RESPONSIVE BEHAVIOR

### Breakpoints Used
- xl: 1280px+ (all columns visible)
- lg: 1024px+ (hide tags)
- md: 768px+ (hide phone, tags)
- sm: 640px+ (hide phone, tags, status)
- xs: <640px (only name, checkbox, actions)

✅ **Assessment**: Excellent progressive disclosure strategy

### Mobile Issues
- ⚠️ Search bar may be tight at 375px
- ⚠️ Bulk action bar may wrap awkwardly
- ✅ Table columns hide appropriately

---

## 17. ACCESSIBILITY

### Current State
- ✅ Checkboxes have proper input elements
- ✅ Buttons have text labels
- ✅ Icons accompanied by text
- ✅ Delete confirmation uses native confirm()
- ⚠️ Table could use better semantic markup
- ⚠️ Search input could use aria-label
- ⚠️ Bulk actions bar could announce selection count

---

## 18. PERFORMANCE

### Good ✅
- React Query caching (30s stale time)
- Debounced search (300ms)
- useCallback for toggleSelect
- Proper Set usage for selection
- Conditional rendering

### Concerns
- None identified

---

## 19. DARK MODE

### Current Token Usage
- ✅ `text-foreground`, `text-muted-foreground`
- ✅ `bg-background`, `bg-card`, `bg-muted`
- ✅ `border-border`
- ❌ **Tag inline styles** will break dark mode

**Risk**: LOW (only tag colors are issues)

---

## 20. COLOR VIOLATIONS

### Total: 2 instances

Both are tag colors using inline styles:

1. **Contacts list page** (line ~183):
   ```tsx
   style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
   ```

2. **Contact detail page** (line ~131):
   ```tsx
   style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
   ```

**Pattern**: Manual opacity using string interpolation `${color}20`

---

## 21. TRANSFORMATION PRIORITIES

### Critical (Must Fix)
1. **Fix tag color inline styles** (2 instances)
2. **Migrate to Phase 2C Table component**
3. **Decide on placeholder buttons** (Filter, Export, Merge, Bulk Delete)
4. **Add pagination controls** (data exists, UI missing)

### High (Should Fix)
5. **Verify/fix import route**
6. **Add error states**
7. **Wire merge if simple, else remove/disable**
8. **Improve mobile bulk action bar**

### Medium (Nice to Have)
9. **Add sort controls** (if backend supports)
10. **Improve accessibility** (aria-labels, semantic table)
11. **Add keyboard shortcuts** (Cmd+K search, etc.)

### Low (Defer to Phase 3)
12. **Implement full filter panel**
13. **Implement export**
14. **Advanced bulk operations**

---

## 22. DECISION MATRIX

| Feature | Exists in Backend? | Current UI | Recommendation |
|---------|-------------------|------------|----------------|
| **Search** | ✅ Yes | ✅ Works | Keep |
| **Filter** | ⚠️ Likely | ❌ Placeholder | Remove or disable |
| **Export** | ❌ Unknown | ❌ Placeholder | Remove or disable |
| **Import** | ❌ Unknown | ⚠️ Dead link? | Verify/fix or remove |
| **Merge** | ✅ Yes (API exists) | ❌ Placeholder | Wire or remove |
| **Bulk Delete** | ⚠️ Partial (single only) | ❌ Placeholder | Loop implementation or remove |
| **Pagination** | ✅ Yes (cursor-based) | ❌ Missing UI | **MUST ADD** |
| **Sort** | ❌ Unknown | ❌ Missing | Defer |

---

## 23. FILES TO MODIFY

1. `apps/web/src/app/(dashboard)/contacts/page.tsx` - Main list
2. `apps/web/src/app/(dashboard)/contacts/[id]/page.tsx` - Detail page
3. Consider: New `Table` component wrapper

**DO NOT MODIFY**:
- `contact-drawer.tsx` - Already excellent
- `contacts.queries.ts` - API layer working correctly

---

## 24. PHASE 2C TABLE COMPONENT STATUS

**Current**: Contacts uses custom `<table>` markup

**Phase 2C Table** (from inventory): Component exists at `components/ui/table.tsx`

**Migration Needed**: YES - Transform custom table to use Table component

---

## 25. PRE-TRANSFORMATION CHECKLIST

✅ **Data Sources**: Real API, proper React Query integration  
✅ **Loading States**: Present and appropriate  
✅ **Empty States**: Contextual and helpful  
✅ **Current Functionality**: Documented  
✅ **Color Violations**: Identified (2 instances)  
✅ **Placeholder Actions**: Identified (4 buttons)  
✅ **Responsive Strategy**: Solid foundation  
✅ **Performance**: Good patterns in place  
✅ **Build Status**: Verified in Phase 2D.1/2D.2

**Ready to proceed**: ✅ YES

---

*Audit completed: 2026-08-04*  
*Proceeding to Phase 2D.3.2: Implementation*
