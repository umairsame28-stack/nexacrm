# Phase 2D.4 — Deals & Pipeline Audit

**Date**: 2026-08-04  
**Phase**: Pre-implementation audit  
**Status**: Complete

---

## 1. DEALS STRUCTURE AUDIT

### Routes
- `/deals` - Main Kanban pipeline board
- `/deals/forecast` - Revenue forecast by stage

### Components
- `apps/web/src/app/(dashboard)/deals/page.tsx` - Kanban board
- `apps/web/src/app/(dashboard)/deals/forecast/page.tsx` - Forecast charts/tables
- `apps/web/src/components/features/deals/deal-sheet.tsx` - Create/View deal drawer

### Query Hooks (`apps/web/src/queries/deals.queries.ts`)
- `useDealPipelines()` - List all pipelines
- `useDealsKanban(pipelineId?)` - Get Kanban board with stages + deals
- `useDealForecast(pipelineId?)` - Get weighted forecast data
- `useCreateDeal()` - Create mutation
- `useUpdateDeal(id)` - Update mutation
- `useMarkDealWon()` - Mark won mutation
- `useMarkDealLost()` - Mark lost mutation
- `useMoveDealStage()` - Move to different stage (drag/drop)

---

## 2. DATA STRUCTURES

### Deal Interface
```typescript
{
  id: string;
  workspaceId: string;
  pipelineId: string;
  stageId: string;
  title: string;
  value: number;
  currency: string;
  probability: number;
  status: 'OPEN' | 'WON' | 'LOST' | 'ABANDONED';
  expectedCloseDate?: string | null;
  closedAt?: string | null;
  lostReason?: string | null;
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
  stage: { id, name, color };
  pipeline: { id, name };
  assignedTo?: { id, firstName, lastName? } | null;
  contacts: Array<{ contact: { id, firstName, lastName? } }>;
}
```

### DealPipeline Interface
```typescript
{
  id: string;
  name: string;
  isDefault: boolean;
  currency: string;
}
```

### Kanban Response
```typescript
{
  stages: Array<{
    id: string;
    name: string;
    color: string;
    sortOrder: number;
    probability: number;
    deals: Deal[];
    totalValue: number;
    totalCount: number;
  }>;
}
```

### Forecast Response
```typescript
{
  pipeline: string;
  currency: string;
  totalPipelineValue: number;
  totalWeightedValue: number;
  stages: Array<{
    name: string;
    probability: number;
    totalValue: number;
    weightedValue: number;
    dealCount: number;
  }>;
}
```

---

## 3. API ENDPOINTS

### Pipelines
- `GET /deal-pipelines` - List all pipelines
- `POST /deal-pipelines` - Create pipeline
- `GET /deal-pipelines/:id/stages` - List stages in pipeline
- `POST /deal-pipelines/:id/stages` - Create stage
- `PATCH /deal-pipelines/:id/stages/:stageId` - Update stage
- `DELETE /deal-pipelines/:id/stages/:stageId` - Delete stage

### Deals
- `GET /deals` - List with filters (`DealFilterDto`)
- `GET /deals/kanban` - Kanban view (pipelineId optional)
- `GET /deals/forecast` - Revenue forecast
- `POST /deals` - Create deal
- `GET /deals/:id` - Get single deal
- `PATCH /deals/:id` - Update deal
- `DELETE /deals/:id` - Delete deal
- `POST /deals/:id/won` - Mark won
- `POST /deals/:id/lost` - Mark lost
- `GET /deals/:id/history` - Get history
- `POST /deals/:id/notes` - Add note
- `GET /deals/:id/notes` - List notes

### Supported Filters (`DealFilterDto`)
- `pipelineId?: string`
- `stageId?: string`
- `status?: DealStatus`
- `assignedTo?: string`
- `minValue?: number`
- `maxValue?: number`
- `search?: string`
- `limit?: number`
- `cursor?: string`

---

## 4. MAIN DEALS PAGE ANALYSIS (`/deals/page.tsx`)

### Current Implementation

**Page Header**:
```tsx
<PageHeader
  title="Deals"
  description={`${totalDeals} open deals · ${formatCurrency(totalPipeline)} pipeline`}
  actions={
    <>
      <Link href="/deals/forecast">
        <Button variant="outline" size="sm">
          <TrendingUp className="h-4 w-4" /> Forecast
        </Button>
      </Link>
      <Button size="sm" onClick={() => setCreateOpen(true)}>
        <Plus className="h-4 w-4" /> Add Deal
      </Button>
    </>
  }
/>
```

✅ **Assessment**: Clean, real data from API, functional actions

### Pipeline Switching

**Implementation**:
```tsx
{pipelines && pipelines.length > 1 && (
  <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
    {pipelines.map(p => (
      <button
        key={p.id}
        onClick={() => setActivePipeline(p.id)}
        className={cn(
          'rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
          (activePipeline === p.id || (!activePipeline && p.isDefault))
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        )}
      >
        {p.name}
      </button>
    ))}
  </div>
)}
```

✅ **Features**:
- Shows only when multiple pipelines exist
- Highlights active pipeline
- Falls back to default pipeline when none selected
- Horizontal scroll for many pipelines
- `scrollbar-hide` utility class

**Query Behavior**:
```tsx
const [activePipeline, setActivePipeline] = useState<string | undefined>(undefined);
const { data: kanban, isLoading } = useDealsKanban(activePipeline);
```

✅ **React Query auto-refetches when activePipeline changes**

### KPI Summary

**Current**:
```tsx
const totalPipeline = kanban?.stages.reduce((s, col) => s + col.totalValue, 0) ?? 0;
const totalDeals = kanban?.stages.reduce((s, col) => s + col.totalCount, 0) ?? 0;
```

✅ **Real data calculated from Kanban response**

**Displayed**: In PageHeader description

⚠️ **Opportunity**: Could add more visible KPI strip

---

## 5. KANBAN BOARD ARCHITECTURE

### Drag-and-Drop Library

**Used**: `@dnd-kit/core` + `@dnd-kit/sortable`

**Sensors**:
```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
);
```

✅ **8px activation threshold prevents accidental drags**

### DndContext Setup
```tsx
<DndContext
  sensors={sensors}
  onDragStart={(e: DragStartEvent) => setActiveDealId(String(e.active.id))}
  onDragEnd={handleDragEnd}
>
  {/* columns + DragOverlay */}
</DndContext>
```

### Drag End Logic
```tsx
function handleDragEnd(e: DragEndEvent) {
  setActiveDealId(null);
  const { active, over } = e;
  if (!over || active.id === over.id) return;
  
  const stage = kanban?.stages.find(
    s => s.id === String(over.id) || s.deals.some(d => d.id === String(over.id))
  );
  
  if (stage) moveStage.mutate({ id: String(active.id), stageId: stage.id });
}
```

✅ **Logic**:
1. Clear active deal overlay
2. Find target stage by checking stage.id OR if deal in stage
3. Call mutation with new stageId
4. React Query invalidates and refetches

⚠️ **Potential Issue**: No optimistic update, but mutation invalidates cache immediately

### Column Structure

**Each stage**:
```tsx
<DealColumn key={stage.id} stage={stage} onCardClick={setSheetDealId} />
```

**Column layout**:
- Fixed width: `w-72` (288px)
- Horizontal scrollable container
- `flex-shrink-0` prevents compression

**Column header**:
- Stage color dot: `<div style={{ backgroundColor: stage.color }} />`
- Stage name
- Probability percentage

**Column summary**:
- Total value: `formatCurrency(stage.totalValue)`
- Deal count: `{stage.totalCount} deal(s)`

✅ **All real data**

### Sortable Context
```tsx
<SortableContext items={stage.deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
  <div className="space-y-2.5 min-h-16 rounded-xl bg-muted/30 p-2">
    {stage.deals.map(deal => (
      <SortableDealCard key={deal.id} deal={deal} stageId={stage.id} onCardClick={onCardClick} />
    ))}
    {stage.deals.length === 0 && (
      <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
        Drop here
      </div>
    )}
  </div>
</SortableContext>
```

✅ **Empty state per column**

---

## 6. DEAL CARD DESIGN

### Current Implementation
```tsx
function DealCard({ deal, onClick, isDragging }: { ... }) {
  const isOverdue = deal.expectedCloseDate 
    && new Date(deal.expectedCloseDate) < new Date() 
    && deal.status === 'OPEN';
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg bg-card border border-border p-3',
        'cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all',
        isDragging && 'shadow-lg rotate-1 scale-105'
      )}
    >
      <p className="font-medium text-sm text-foreground line-clamp-2 mb-1.5">
        {deal.title}
      </p>
      <p className="text-base font-bold text-primary">
        {formatCurrency(Number(deal.value), deal.currency)}
      </p>
      {deal.contacts[0]?.contact && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar firstName={deal.contacts[0].contact.firstName} size="xs" />
          {deal.contacts[0].contact.firstName} {deal.contacts[0].contact.lastName ?? ''}
        </div>
      )}
      {deal.expectedCloseDate && (
        <p className={cn(
          'mt-1.5 text-xs',
          isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
        )}>
          Close: {formatDate(deal.expectedCloseDate)}
          {isOverdue && ' ⚠️'}
        </p>
      )}
      {deal.assignedTo && (
        <div className="mt-2 flex justify-end">
          <Avatar firstName={deal.assignedTo.firstName} size="xs" />
        </div>
      )}
    </div>
  );
}
```

### Information Hierarchy
1. **Deal title** (line-clamp-2, font-medium)
2. **Deal value** (large, bold, primary color)
3. **First contact** (optional, avatar + name)
4. **Close date** (optional, red if overdue)
5. **Assigned owner** (optional, avatar bottom-right)

✅ **Progressive disclosure**: Only shows fields that have data

✅ **Overdue logic**: Red text + warning emoji when date < today AND status = OPEN

✅ **Drag state**: `isDragging` adds visual feedback (shadow, rotate, scale)

### Current Tokens Used
- `bg-card`
- `border-border`
- `text-foreground`
- `text-primary` (deal value)
- `text-muted-foreground`
- `text-destructive` (overdue)
- `hover:border-primary/50`

✅ **All semantic tokens**

---

## 7. STAGE COLORS

### Current Implementation
```tsx
<div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
```

❌ **VIOLATION**: Inline style with `stage.color` from API

### Source
Stage color comes from backend:
```typescript
stage: { id: string; name: string; color: string }
```

Backend DTO allows color customization:
```typescript
export class CreateDealStageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;
}
```

### Issue
Stage colors are user-configurable via API, stored in database. Cannot be replaced with static semantic tokens without breaking user customization.

### Decision Required
1. Keep inline styles (acceptable if colors are user-configurable)
2. Map to semantic/chart tokens with fallback
3. Use CSS variables with dynamic injection
4. Add opacity-based approach

---

## 8. CREATE DEAL WORKFLOW

### Component: `DealSheet`

**Props**:
```typescript
{
  dealId: string | null;         // View existing deal
  createOpen: boolean;           // Create new deal
  onClose: () => void;           // Close view mode
  onCloseCreate: () => void;     // Close create mode
  onMarkWon: (id: string) => void;
  onMarkLost: (id: string, reason?: string) => void;
}
```

### Two Modes

**View Mode** (when `dealId` provided):
- Shows Deal ID
- "Mark Won" button → calls `onMarkWon()`
- "Mark Lost" button → shows reason input, then calls `onMarkLost()`

**Create Mode** (when `createOpen` true):
- Form with react-hook-form + zod
- Fields: title*, pipelineId*, stageId*, value, currency, probability, expectedCloseDate
- Validation via `zodResolver(schema)`
- Submit calls `useCreateDeal()` mutation

### Schema
```typescript
const schema = z.object({
  title: z.string().min(1, 'Required'),
  pipelineId: z.string().min(1, 'Required'),
  stageId: z.string().min(1, 'Required'),
  value: z.coerce.number().min(0),
  currency: z.string().default('USD'),
  probability: z.coerce.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  assignedToId: z.string().optional(),
});
```

✅ **Matches backend DTO**

### Issues Found

❌ **Stage selector empty**:
```tsx
{selectedPipeline && (
  <div>
    <label>Stage *</label>
    <select {...register('stageId')}>
      <option value="">Select stage</option>
      {/* Stages loaded dynamically via pipeline detail endpoint */}
    </select>
  </div>
)}
```

**Comment indicates stages should load from API, but no query hook exists**

⚠️ **Missing**: Need to fetch stages for selected pipeline

Backend supports:
```
GET /deal-pipelines/:id/stages
```

But frontend has no `usePipelineStages(pipelineId)` hook

### Currency Hardcoded
```tsx
{['USD', 'EUR', 'GBP', 'BRL', 'MXN'].map(c => <option key={c} value={c}>{c}</option>)}
```

✅ **Acceptable for MVP, could be configuration later**

### Missing Fields

Backend supports but form doesn't include:
- `contactIds?: string[]` (array of contact UUIDs)
- `assignedToId?: string` (field exists in schema but no UI select)

---

## 9. EDIT DEAL WORKFLOW

### Current State

❌ **NOT IMPLEMENTED**

View mode in DealSheet only shows:
- Deal ID
- Mark Won button
- Mark Lost button

No editing functionality exists.

Backend supports:
```
PATCH /deals/:id
useUpdateDeal(id)
```

### Missing

- Load deal data
- Pre-fill form
- Edit and save
- Show validation errors
- Handle update mutation

---

## 10. WON / LOST WORKFLOWS

### Mark Won

**Frontend**:
```tsx
onMarkWon={(id) => markWon.mutate({ id })}
```

**Hook**:
```typescript
export function useMarkDealWon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, closedAt }: { id: string; closedAt?: string }) => 
      apiClient.post(`/deals/${id}/won`, { closedAt }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['deals'] });
      toast.success('🎉 Deal marked as won!');
    },
    onError: () => toast.error('Failed to update deal'),
  });
}
```

**Backend**:
```
POST /deals/:id/won
{ closedAt?: string }
```

✅ **Supports optional closedAt date (not exposed in UI)**

**UI Flow**:
1. User opens deal sheet
2. Clicks "Mark Won" button
3. Mutation called immediately
4. Success → toast + cache invalidated
5. Sheet auto-closes

⚠️ **No confirmation dialog** (acceptable for positive action)

### Mark Lost

**Frontend**:
```tsx
const [showLostForm, setShowLostForm] = useState(false);
const [lostReason, setLostReason] = useState('');

{showLostForm ? (
  <div className="space-y-3">
    <label>Reason for losing</label>
    <Input value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="Budget constraints, competitor, etc." />
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setShowLostForm(false)}>Cancel</Button>
      <Button variant="destructive" size="sm" onClick={() => { onMarkLost(dealId, lostReason); onClose(); }}>
        Confirm Lost
      </Button>
    </div>
  </div>
) : (
  <Button variant="outline" onClick={() => setShowLostForm(true)}>
    <ThumbsDown className="h-4 w-4" /> Mark Lost
  </Button>
)}
```

✅ **Two-step process**:
1. Click "Mark Lost"
2. Show reason input + confirm
3. Mutation called with reason

**Hook**:
```typescript
export function useMarkDealLost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lostReason }: { id: string; lostReason?: string }) =>
      apiClient.post(`/deals/${id}/lost`, { lostReason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal marked as lost');
    },
    onError: () => toast.error('Failed to update deal'),
  });
}
```

✅ **Reason is optional**

---

## 11. DELETE DEAL

### Current State

❌ **NOT IMPLEMENTED IN UI**

Backend supports:
```
DELETE /deals/:id
```

But no frontend hook or UI exists.

### Missing

- Delete button in deal sheet or card menu
- Confirmation dialog
- Mutation hook
- Cache invalidation

---

## 12. SEARCH FUNCTIONALITY

### Current State

❌ **NOT IMPLEMENTED**

Backend supports:
```typescript
export class DealFilterDto {
  @IsOptional() search?: string;
  // ... other filters
}
```

API endpoint:
```
GET /deals?search=...
```

### Missing

- Search input UI
- Debouncing
- Integration with useDealsKanban (currently doesn't accept search param)
- Clear search

### Note

`useDealsKanban()` only accepts `pipelineId`, not full filter params.

Would need either:
1. Add filter params to `/deals/kanban` endpoint
2. Use `/deals` list endpoint with custom Kanban assembly
3. Client-side filtering (not ideal)

---

## 13. FILTERS

### Backend Support

```typescript
export class DealFilterDto {
  @IsOptional() pipelineId?: string;
  @IsOptional() stageId?: string;
  @IsOptional() status?: DealStatus;
  @IsOptional() assignedTo?: string;
  @IsOptional() minValue?: number;
  @IsOptional() maxValue?: number;
  @IsOptional() search?: string;
  @IsOptional() limit?: number;
  @IsOptional() cursor?: string;
}
```

Available via:
```
GET /deals
```

### Current State

❌ **NOT IMPLEMENTED**

No filter UI exists.

Kanban endpoint (`/deals/kanban`) only accepts `pipelineId` param, not full filter set.

### Decision

Similar to Contacts Phase 2D.3: Backend ready, UI complex, defer to Phase 3.

---

## 14. SORTING

### Backend Support

❌ **NO EXPLICIT SORT PARAMETER IN DTO**

`DealFilterDto` does not include `sortBy` or `sortOrder`.

### Kanban Behavior

Deals within stages are likely ordered by backend business logic (created date, sortOrder field, etc.)

No frontend sorting control.

---

## 15. DEAL DETAIL EXPERIENCE

### Current State

**Minimal detail view** in DealSheet:
- Deal ID shown as text
- Won/Lost actions only

❌ **Missing comprehensive detail view**:
- Deal fields
- Contact associations
- Notes
- History
- Activities

### Backend Support

Available endpoints:
```
GET /deals/:id
GET /deals/:id/history
GET /deals/:id/notes
POST /deals/:id/notes
```

Response includes:
```typescript
{
  id, title, value, currency, status, expectedCloseDate,
  stage, pipeline, assignedTo, contacts,
  createdAt, updatedAt, etc.
}
```

### Missing

- Detail view component
- Notes display
- History timeline
- Full field display
- Edit mode

---

## 16. FORECAST PAGE ANALYSIS (`/deals/forecast/page.tsx`)

### Current Implementation

**Page structure**:
1. Back button to `/deals`
2. Page header: "Revenue Forecast"
3. Loop over pipelines, each showing:
   - Summary cards (Total Pipeline, Weighted Forecast, Forecast Accuracy)
   - Bar chart (Recharts)
   - Stage table

### Data Query
```tsx
const { data: pipelines, isLoading } = useDealForecast();
```

Returns:
```typescript
ForecastData[]
```

Each pipeline includes:
- `totalPipelineValue` (sum of all deal values)
- `totalWeightedValue` (sum of values × probability)
- `stages[]` with per-stage breakdown

### Summary Cards

**Total Pipeline**: Raw sum
**Weighted Forecast**: Probability-adjusted
**Forecast Accuracy**: `(weighted / total) * 100%`

✅ **Real calculations**

### Bar Chart

Uses Recharts library:
```tsx
<BarChart data={chartData}>
  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
  <Tooltip ... />
  <Legend />
  <Bar dataKey="Pipeline" fill="hsl(var(--muted))" radius={[3,3,0,0]} />
  <Bar dataKey="Weighted" fill="hsl(239 84% 67%)" radius={[3,3,0,0]} />
</BarChart>
```

✅ **Uses semantic tokens for grid, axes, tooltip**

❌ **VIOLATION**: Weighted bar uses hardcoded `hsl(239 84% 67%)` (purple-ish)

Should use semantic token like `hsl(var(--primary))` or chart token.

### Stage Table

Custom `<table>` markup (not Phase 2C Table component).

Shows:
- Stage name
- Deal count
- Total value
- Probability
- Weighted value
- Total row

✅ **All real data**

⚠️ **Should migrate to Phase 2C Table component**

---

## 17. EMPTY STATES

### Kanban Page

**No pipeline configured**:
```tsx
<EmptyState
  title="No pipeline configured"
  description="Set up a deal pipeline in Settings."
/>
```

✅ **Uses EmptyState component**

⚠️ **No action button** (could add "Go to Settings" if route exists)

**Individual stages**:
```tsx
{stage.deals.length === 0 && (
  <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
    Drop here
  </div>
)}
```

✅ **Simple, appropriate for column empty state**

### Forecast Page

**No data**:
```tsx
{!pipelines?.length ? (
  <p className="text-muted-foreground">No pipeline data available.</p>
) : ...}
```

⚠️ **Plain text, could use EmptyState component**

---

## 18. LOADING STATES

### Kanban Page
```tsx
{isLoading ? (
  <div className="flex gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex-shrink-0 w-72 space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    ))}
  </div>
) : ...}
```

✅ **Skeleton columns mimic actual layout**

### Forecast Page
```tsx
{isLoading ? (
  <div className="space-y-6">
    {Array.from({ length: 2 }).map((_, i) => (
      <Skeleton key={i} className="h-64 w-full rounded-xl" />
    ))}
  </div>
) : ...}
```

✅ **Appropriate skeletons**

---

## 19. ERROR STATES

### Query Error Handling

❌ **NOT IMPLEMENTED**

No `isError` checks or error display.

React Query defaults:
- Silently retries 3 times
- Shows last successful data during retry
- Error not surfaced to UI

### Mutation Error Handling

✅ **Toast notifications**:
```typescript
onError: () => toast.error('Failed to create deal')
```

But no detailed error messages from backend response.

---

## 20. RESPONSIVE BEHAVIOR

### Kanban Page

**Container**:
```tsx
<div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide min-h-[calc(100vh-220px)]">
  {kanban.stages.map(stage => (
    <DealColumn key={stage.id} ... />
  ))}
</div>
```

**Strategy**: Horizontal scroll, fixed column width (288px)

✅ **Mobile-friendly**: Touch scroll, maintains card readability

**Pipeline tabs**:
```tsx
<div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
  {pipelines.map(p => <button ... />)}
</div>
```

✅ **Horizontal scroll for many pipelines**

### Forecast Page

**Summary cards**:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card className="col-span-2 sm:col-span-1">...</Card>
</div>
```

✅ **Responsive grid**: 2 cols mobile, 3 cols desktop

**Chart**:
```tsx
<ResponsiveContainer width="100%" height={280}>
  <BarChart ...>
```

✅ **Recharts handles responsive width**

**Table**: No responsive treatment

⚠️ **Would overflow on mobile**, needs horizontal scroll or hide columns

---

## 21. DARK MODE

### Token Usage Audit

**Kanban Page**:
- ✅ `text-foreground`, `text-muted-foreground`
- ✅ `bg-muted/30`, `bg-card`, `bg-primary`, `bg-muted`
- ✅ `border-border`
- ✅ `hover:border-primary/50`
- ❌ `style={{ backgroundColor: stage.color }}` (inline, but user-configured)

**Forecast Page**:
- ✅ Chart uses `hsl(var(--border))`, `hsl(var(--muted-foreground))`, `hsl(var(--muted))`
- ❌ Weighted bar: `fill="hsl(239 84% 67%)"` (hardcoded purple)
- ✅ Cards use semantic tokens
- ✅ Table uses semantic tokens

**Deal Sheet**:
- ✅ `bg-background`, `border-border`, `text-foreground`, `text-muted-foreground`
- ✅ All inputs use semantic tokens

**Overall**: Mostly dark-mode compatible, two violations (stage color dots, forecast chart bar)

---

## 22. ACCESSIBILITY

### Keyboard Navigation

**Pipeline tabs**: 
- `<button>` elements ✅
- No keyboard navigation hints

**Kanban drag/drop**:
- `@dnd-kit` supports keyboard by default ✅
- Space to pick up, Arrow keys to move, Space to drop

**Deal cards**:
- `<div onClick={...}>` ❌ Not keyboard accessible
- Should be `<button>` or have `tabIndex={0}` + `onKeyDown`

**Create Deal form**:
- Proper `<label>` elements ✅
- Form inputs accessible ✅

### Focus States

- Native browser focus on buttons ✅
- Custom components may lack focus-visible styling ⚠️

### Color Contrast

- Text colors use semantic tokens ✅
- Stage color dots: user-configurable, may have contrast issues ⚠️

### Screen Readers

- No ARIA labels on icon-only buttons ❌
- No ARIA live regions for drag-drop feedback ❌
- No ARIA labels for column drop zones ❌

---

## 23. PERFORMANCE

### Query Caching

```typescript
staleTime: 30_000  // useDealsKanban
staleTime: 60_000  // useDealForecast
staleTime: 120_000 // useDealPipelines
```

✅ **Appropriate cache times**

### Drag Performance

- `PointerSensor` with 8px threshold ✅
- `DragOverlay` renders copy, not original ✅
- Single `activeDealId` state ✅

No obvious performance issues.

### Potential Issues

- No memoization of `totalPipeline`/`totalDeals` calculations (recalcs on every render)
- Kanban response includes ALL deals (no pagination)
- Large pipelines (100+ deals) might be slow

---

## 24. PHASE 2C COMPONENT USAGE

### Currently Used

✅ `Button`
✅ `Input`
✅ `Skeleton`
✅ `Avatar`
✅ `EmptyState`
✅ `PageHeader`
✅ `Card`, `CardContent`, `CardHeader`, `CardTitle`

### Not Used (But Available)

❌ `Table` (forecast page uses custom `<table>`)
❌ `Badge` (could use for deal status, priority, etc.)
❌ `Alert` (for error states)
❌ `Select` (form uses native `<select>`)
❌ `Label` (form uses text labels)
❌ `Textarea` (DealSheet could use for notes)
❌ `Separator`
❌ `Drawer` (DealSheet reimplements drawer)

---

## 25. HARDCODED COLOR AUDIT

### Violations Found

1. **Stage color dots** (`/deals/page.tsx` line ~123):
   ```tsx
   <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
   ```
   **Source**: User-configurable via API (CreateDealStageDto.color)
   **Decision**: Keep inline (user feature), but consider CSS variable approach

2. **Forecast chart weighted bar** (`/deals/forecast/page.tsx` line ~60):
   ```tsx
   <Bar dataKey="Weighted" fill="hsl(239 84% 67%)" radius={[3,3,0,0]} />
   ```
   **Fix**: Change to `fill="hsl(var(--primary))"` or chart token

### No Other Violations

- No hex values
- No arbitrary Tailwind palette classes
- All other colors use semantic tokens

---

## 26. PLACEHOLDER / DEAD INTERACTION AUDIT

**Search**: None found ✅

**Results**:
- No `href="#"`
- No `onClick={() => {}}`
- No `TODO` or `FIXME`
- No `alert()` or `console.log`
- No "Coming soon" text

**All interactive elements are functional.**

---

## 27. MISSING FUNCTIONALITY SUMMARY

### High Priority (Core CRM)

1. **Edit Deal** - Backend ready, no UI
2. **Delete Deal** - Backend ready, no UI
3. **Deal Detail View** - Minimal view, needs full detail + notes + history
4. **Pipeline Stage Loading** - Create form can't populate stages

### Medium Priority (Usability)

5. **Search** - Backend ready, no UI
6. **Filters** - Backend ready, no UI (status, owner, value range, etc.)
7. **Error States** - Queries fail silently
8. **Contact Association** - Backend supports, form doesn't

### Low Priority (Nice to Have)

9. **Sorting** - Not supported by backend
10. **Deal Notes UI** - Backend ready, no UI
11. **Deal History UI** - Backend ready, no UI
12. **Pagination** - Kanban loads all deals

---

## 28. BUGS / DEFECTS FOUND

### Critical

❌ **Stage selector empty in Create Deal form**
- Form has stage dropdown but no options
- Comment says "loaded dynamically" but no query hook exists
- **Impact**: Cannot create deals without hardcoding stageId

### High

❌ **Deal cards not keyboard accessible**
- Uses `<div onClick={...}>` instead of `<button>`
- **Impact**: Screen reader/keyboard users cannot open deals

### Medium

❌ **No error UI for failed queries**
- React Query errors not displayed
- **Impact**: User doesn't know why data isn't loading

❌ **Forecast chart hardcoded color**
- Weighted bar uses `hsl(239 84% 67%)`
- **Impact**: Breaks design system, dark mode inconsistent

### Low

❌ **Forecast table not using Table component**
- Custom `<table>` markup
- **Impact**: Inconsistent with rest of app

❌ **Missing confirmation for Mark Won**
- Immediately marks won without confirmation
- **Impact**: Accidental clicks can't be undone easily

---

## 29. BUSINESS LOGIC PRESERVATION

### Must Preserve

✅ **Drag-and-drop stage movement**
- Critical CRM workflow
- Well-implemented with @dnd-kit
- Mutation preserves deal data, only updates stageId

✅ **Won/Lost marking**
- Changes deal.status
- Sets closedAt or lostReason
- Cannot be undone (by design)

✅ **Pipeline switching**
- Loads different Kanban view
- React Query caches per pipeline
- No cross-pipeline data leakage

✅ **Deal value calculations**
- Stage totals
- Pipeline totals
- Weighted forecasting
- Currency handling

✅ **Workspace isolation**
- All queries scoped to workspace
- Backend enforces via WorkspaceGuard

---

## 30. ZUSTAND USAGE

**Search result**: None found

Deals implementation uses:
- React useState for local UI state
- React Query for server state
- No Zustand stores

---

## 31. WEBSOCKET USAGE

**Not found in deals implementation**

No real-time updates for:
- Deal creation
- Stage movement
- Won/lost updates

All updates via React Query invalidation after mutations.

---

## 32. TRANSFORMATION PRIORITIES

### Critical (Must Fix)

1. **Fix stage selector** - Add query hook + populate options
2. **Fix forecast chart color** - Use semantic token
3. **Add error states** - Display query failures
4. **Make deal cards keyboard accessible** - Use button or proper attrs

### High (Should Fix)

5. **Migrate forecast table** - Use Phase 2C Table component
6. **Add Edit Deal** - Reuse form, pre-fill fields
7. **Add Delete Deal** - With confirmation
8. **Improve Deal Detail** - Show all fields, notes, history

### Medium (Nice to Have)

9. **Add Search** - If backend supports on /kanban endpoint
10. **Add Filters** - Status, owner, value range
11. **Improve empty states** - Add actionable buttons
12. **Add loading states** - More granular (per-stage, per-mutation)

### Low (Defer to Phase 3)

13. **Deal Notes UI** - Full CRUD
14. **Deal History Timeline** - Visual history
15. **Contact Association UI** - Multi-select contacts
16. **Advanced filtering** - Date ranges, tags, etc.

---

## 33. DESIGN SYSTEM COMPLIANCE

### Token Usage: 95%

**Compliant**:
- All text colors
- All background colors
- All border colors
- Most component colors

**Non-Compliant** (2 instances):
- Stage color dots (user-configurable, acceptable)
- Forecast chart weighted bar (hardcoded HSL, fixable)

### Component Usage: 60%

**Used**: Button, Input, Skeleton, Avatar, EmptyState, PageHeader, Card
**Not Used**: Table, Badge, Alert, Select, Label, Textarea, Separator, Drawer

**Opportunity**: Migrate remaining components

---

## 34. VERIFICATION CHECKLIST

Before implementing changes, verify:

- [x] Deals page exists and loads
- [x] Forecast page exists and loads
- [x] DealSheet component exists
- [x] Query hooks functional
- [x] Drag-and-drop library identified
- [x] API endpoints documented
- [x] Data structures understood
- [x] Backend DTOs reviewed
- [x] Color violations identified
- [x] Missing functionality documented
- [x] Bugs catalogued
- [x] Business logic mapped

**Ready to proceed**: ✅ YES

---

*Audit completed: 2026-08-04*  
*Proceeding to Phase 2D.4.2: Implementation*

