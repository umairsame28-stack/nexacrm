# Phase 2D.2 — Dashboard Audit

**Date**: 2026-08-04  
**Phase**: Pre-implementation audit  
**Status**: Complete

---

## 1. DASHBOARD STRUCTURE AUDIT

### Current Page Hierarchy

```
Dashboard Page (/dashboard)
├── Background wrapper (hardcoded #F8FAFC)
├── WelcomeHero component
├── AI Insights Banner (conditional, dismissible)
├── KPI Cards (5 cards in grid)
├── Charts Row (Revenue + Customer Growth)
├── Bottom Row (Team Performance + Activity/Tasks)
└── Floating Quick Actions
```

### Component Breakdown

**Custom Dashboard Components** (in `apps/web/src/components/dashboard/`):
1. `welcome-hero.tsx` - Hero section with greeting, revenue highlight
2. `stat-card.tsx` - Animated KPI cards with sparklines
3. `activity-feed.tsx` - Timeline-style activity list
4. `quick-actions.tsx` - Floating action button with menu
5. `ai-insights.tsx` - AI-powered insights component (appears unused in current implementation)

**Phase 2C Components Used**:
- Card, CardHeader, CardTitle, CardContent
- Badge
- Avatar
- Skeleton
- Button
- EmptyState

**Third-party**:
- Recharts (AreaChart, BarChart)

---

## 2. DATA SOURCES AUDIT

### Primary Query: `useDashboard()`

**Endpoint**: `GET /dashboard`  
**Refetch Interval**: 60 seconds  
**Stale Time**: 30 seconds

**Returns**:
```typescript
{
  kpis: {
    totalContacts: number;
    activeConversations: number;
    openLeads: number;
    closedDealsThisMonth: number;
    revenueThisMonth: number;
    revenuePrevMonth: number;
    revenueChange: number;
    conversionRate: number;
  };
  salesTrend: Array<{ date, revenue, deals }>;
  customerGrowth: Array<{ date, newContacts, cumulative }>;
  teamPerformance: Array<{ agentId, name, conversations, dealsWon, avgResponseMins }>;
  activityFeed: Array<{ type, actor, resource, resourceId, at }>;
  upcomingTasks: Array<{ id, title, priority, dueAt, contact }>;
  todayEvents: Array<{ id, title, startAt, endAt }>;
}
```

✅ **Real data only** - No fabricated metrics  
✅ **Proper loading states** with Skeleton  
✅ **Real calculations** - revenueChange from actual prev/current  

### Secondary Query: `useAIInsights()`

**Endpoint**: `POST /ai/insights`  
**Payload**: `{ period: 'last_30_days' }`  
**Stale Time**: 5 minutes  
**Retry**: false (fails silently if AI not configured)

**Returns**: `{ insights: string[] }`

⚠️ **Note**: AI insights component exists at `components/dashboard/ai-insights.tsx` but is NOT used in the current dashboard page. The page uses a simpler inline banner for insights.

---

## 3. EXISTING SECTIONS — DETAILED

### 3.1 Welcome Hero

**File**: `components/dashboard/welcome-hero.tsx`

**Current Features**:
- Greeting (Good morning/afternoon/evening)
- User's first name
- Current date (full format)
- **Revenue highlight** with gradient background
- Revenue change percentage with trend icon
- Total contacts quick stat
- **3 gradient action buttons**: Add Contact, Create Deal, Import Leads
- Decorative animated circles (right side, desktop only)
- Floating cards with metrics

**Issues Found**:
- ❌ Inline gradient styles: `linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)`
- ❌ Hardcoded background: `#FFFFFF`
- ❌ Decorative elements consume vertical space
- ⚠️ Action buttons have `onClick={() => {}}` - empty handlers
- ⚠️ Marketing-heavy copy ("Your business generated")
- ✅ Real data (revenue, revenueChange, totalContacts)
- ✅ Responsive (hides illustration on mobile)

**Transformation Needed**: **High**
- Remove inline styles
- Simplify hero (reduce decorative elements)
- Wire or defer action buttons honestly

### 3.2 AI Insights Banner

**Location**: Dashboard page (inline, not separate component)

**Current Implementation**:
```tsx
{insights?.insights.length && !insightsDismissed && (
  <div style={{ backgroundColor: '#F0EBFF' }}>
    // Dismissible banner with insights list
  </div>
)}
```

**Issues Found**:
- ❌ Hardcoded background: `#F0EBFF`
- ⚠️ Local dismiss state (not persisted)
- ✅ Real AI insights from API
- ✅ Gracefully hidden if no insights
- ✅ Uses Sparkles icon semantically

**Transformation Needed**: **Medium**
- Migrate to semantic tokens
- Consider Alert component

### 3.3 KPI Cards (5 cards)

**Component**: `components/dashboard/stat-card.tsx`

**Current Cards**:
1. **Revenue This Month** - formatCurrency(revenueThisMonth), change %, sparkline, success color
2. **Total Contacts** - count, blue color, sparkline
3. **Active Conversations** - count, purple color, sparkline
4. **Open Leads** - count, indigo color, sparkline
5. **Conversion Rate** - formatPercent(conversionRate), primary color, sparkline

**Issues Found**:
- ❌ Arbitrary color classes: `bg-blue-500/10 text-blue-500`, `bg-purple-500/10 text-purple-500`, `bg-indigo-500/10 text-indigo-600`
- ✅ Real data from `kpis` object
- ✅ Sparkline data is real (passed as arrays)
- ✅ Animated count-up on mount
- ✅ Hover effects and group transitions
- ⚠️ StatCard component has complex inline gradient logic

**Transformation Needed**: **High**
- Replace arbitrary colors with semantic chart tokens
- Simplify StatCard component

### 3.4 Revenue Trend Chart

**Type**: AreaChart (Recharts)  
**Data**: `salesTrend` array (date, revenue, deals)  
**Timeframe**: Last 30 days

**Issues Found**:
- ❌ Card wrapper: `style={{ backgroundColor: '#FFFFFF' }}`
- ❌ Hardcoded chart colors:
  - `stopColor="rgb(108, 92, 231)"` in gradient
  - `stopColor="rgb(139, 92, 246)"` in gradient  
  - `stroke="rgb(108, 92, 231)"`
  - `fill="rgb(108, 92, 231)"`
- ❌ Change indicator: `bg-emerald-50 border-emerald-200 bg-emerald-500 text-emerald-700` - arbitrary colors
- ❌ Hardcoded +18.3% (should be dynamic or removed)
- ✅ Real data from API
- ✅ Proper tooltip with formatCurrency
- ✅ Responsive width

**Transformation Needed**: **Critical**
- Remove inline backgroundColor
- Use chart-1/chart-2 tokens
- Make change indicator dynamic or remove if not calculated
- Use semantic success tokens for positive trend

### 3.5 Customer Growth Chart

**Type**: BarChart (Recharts)  
**Data**: `customerGrowth` array (date, newContacts, cumulative)  
**Timeframe**: Last 14 days

**Issues Found**:
- ❌ Card wrapper: `style={{ backgroundColor: '#FFFFFF' }}`
- ❌ Hardcoded bar gradient:
  - `stopColor="rgb(108, 92, 231)"`
  - `stopColor="rgb(139, 92, 246)"`
- ✅ Real data from API
- ✅ Responsive

**Transformation Needed**: **High**
- Remove inline styles
- Use chart tokens

### 3.6 Team Performance Table

**Type**: Custom table markup  
**Data**: `teamPerformance` array

**Columns**: Agent (avatar + name), Conversations, Deals Won, Response Time, Status

**Issues Found**:
- ❌ Card wrapper: `style={{ backgroundColor: '#FFFFFF' }}`
- ❌ Arbitrary colors: `bg-blue-500/10 text-blue-600` for conversations badge
- ❌ Hardcoded text colors: `text-gray-900`, `text-gray-600`
- ❌ Status indicator: `bg-emerald-500` with animate-pulse-subtle
- ⚠️ Could use Phase 2C Table component
- ✅ Real data from API
- ✅ Empty state with icon
- ✅ Avatar rendering
- ✅ Stagger animation on rows

**Transformation Needed**: **High**
- Remove inline styles
- Replace arbitrary colors with semantic tokens
- Consider Table component migration

### 3.7 Activity Feed

**Component**: `components/dashboard/activity-feed.tsx`  
**Data**: `activityFeed` array

**Issues Found**:
- ❌ Activity type colors hardcoded in config object:
  - `text-blue-600`, `bg-blue-500/10`, `border-blue-500/20`
  - `text-purple-600`, `bg-purple-500/10`, `border-purple-500/20`
  - `text-rose-600`, `bg-rose-500/10`, `border-rose-500/20`
  - `text-emerald-600`, `bg-emerald-500/10`, `border-emerald-500/20`
  - `text-indigo-600`, `bg-indigo-500/10`, `border-indigo-500/20`
- ❌ Card wrapper in dashboard: `style={{ backgroundColor: '#FFFFFF' }}`
- ❌ Pulse indicator: `bg-emerald-500`
- ✅ Real data from API
- ✅ Timeline visual design is excellent
- ✅ Empty state with icon
- ✅ Stagger animation
- ✅ Hover effects

**Transformation Needed**: **Critical**
- Refactor activity config to use semantic/chart tokens
- Remove inline styles from card wrapper
- This is the most color-violation-heavy component

### 3.8 Upcoming Tasks

**Data**: `upcomingTasks` array  
**Display**: List with priority dots and due dates

**Issues Found**:
- ❌ Card wrapper: `style={{ backgroundColor: '#FFFFFF' }}`
- ❌ Priority colors: `HIGH: 'text-rose-600'` (hardcoded in page)
- ✅ Uses destructive for URGENT (semantic)
- ✅ Uses primary for MEDIUM (semantic)
- ✅ Real data from API
- ✅ Empty state with CheckCircle2 icon

**Transformation Needed**: **Medium**
- Fix HIGH priority color (should use warning or remain rose with rationale)
- Remove inline styles

### 3.9 Quick Actions

**Component**: `components/dashboard/quick-actions.tsx`

**Actions** (6 total):
1. New Contact - `onClick: () => {}`
2. Create Deal - `onClick: () => {}`
3. Add Task - `onClick: () => {}`
4. Schedule Meeting - `onClick: () => {}`
5. Import Leads - `onClick: () => {}`
6. Send Message - `onClick: () => {}`

**Issues Found**:
- ⚠️ **ALL actions have empty handlers** - marked with TODO Phase 3
- ❌ Gradient classes: `from-blue-500 to-cyan-600`, `from-purple-500 to-pink-600`, etc.
- ✅ Visual design is polished
- ✅ Floating button with pulse animation
- ✅ Grid layout
- ✅ Keyboard accessible

**Transformation Needed**: **Critical**
- Decision required: Wire to real modals OR explicitly defer
- Replace gradient classes with chart tokens or remove gradients

---

## 4. HARDCODED COLOR VIOLATIONS

### Total Count: 42 instances

**By Type**:
1. **Inline hex colors**: 7 instances
   - `#F8FAFC` (page background)
   - `#F0EBFF` (AI banner)
   - `#FFFFFF` (5x card backgrounds)

2. **Inline RGB colors**: 10 instances
   - Chart gradients: `rgb(108, 92, 231)`, `rgb(139, 92, 246)`

3. **Arbitrary Tailwind classes**: 25 instances
   - blue-500/600: 8 instances
   - purple-500/600: 6 instances
   - emerald-500/600/700: 6 instances
   - rose-600: 2 instances
   - indigo-500/600: 3 instances

**By Component**:
- Dashboard page: 15 violations
- activity-feed.tsx: 15 violations
- stat-card.tsx: 5 violations (in colorClass prop)
- welcome-hero.tsx: 4 violations
- quick-actions.tsx: 3 violations

---

## 5. EMPTY / LOADING / ERROR STATES

### Loading State

✅ **Well implemented**:
- Uses DashboardSkeleton function
- Mimics actual layout
- Shows 5 KPI skeletons
- Shows 2 chart skeletons
- No excessive animation

### Empty State

⚠️ **Partial**:
- Individual sections have empty states (team table, activity feed, tasks)
- No global "new workspace" empty state
- Should be added if `totalContacts === 0`

### Error State

❌ **Missing**:
- No error boundary
- No retry mechanism
- Query errors fail silently

**Needs**: Error state when dashboard query fails

---

## 6. RESPONSIVE BEHAVIOR AUDIT

### Current Breakpoints

**Desktop (xl: 1280px+)**:
- KPIs: 5 columns (`xl:grid-cols-5`)
- Charts row: 2:1 split (`xl:col-span-2`)
- Bottom row: 2:1 split (`xl:col-span-2`)

**Tablet (lg: 1024px)**:
- KPIs: 4 columns (`lg:grid-cols-4`)
- Charts: stack vertically
- Bottom row: stack vertically

**Mobile (sm: 640px)**:
- KPIs: 2 columns (`sm:grid-cols-2`)
- All sections stack

**Issues**:
- ✅ Good grid system
- ⚠️ Charts may overflow on small mobile
- ⚠️ WelcomeHero takes significant mobile height
- ⚠️ Quick Actions menu: 2-column grid might be tight on 375px

---

## 7. DARK MODE AUDIT

### Semantic Token Usage

**Good** ✅:
- Text: `text-foreground`, `text-muted-foreground`
- Backgrounds: `bg-background`, `bg-card`, `bg-muted`
- Borders: `border-border`

**Bad** ❌:
- Hardcoded grays: `text-gray-900`, `text-gray-600`, `border-gray-200`
- Inline white: `style={{ backgroundColor: '#FFFFFF' }}`
- Arbitrary colors break in dark mode

**Risk**: High - Many violations will break dark mode

---

## 8. QUICK ACTIONS DECISION MATRIX

| Action | Real Workflow Exists? | Recommendation |
|--------|----------------------|----------------|
| New Contact | ✅ Yes - ContactDrawer | **Wire** - Safe to connect |
| Create Deal | ✅ Yes - DealSheet | **Wire** - Safe to connect |
| Add Task | ✅ Yes - TaskForm | **Wire** - Safe to connect |
| Schedule Meeting | ✅ Yes - EventForm | **Wire** - Safe to connect |
| Import Leads | ⚠️ Route may not exist | **Defer** - Verify route first |
| Send Message | ⚠️ Requires contact selection | **Defer** - Complex UX |

**Decision**: Wire 4 actions (Contact, Deal, Task, Meeting), defer 2 (Import, Message)

---

## 9. AI INSIGHTS - CURRENT vs UNUSED

### Current Implementation (In Use)

**Location**: Dashboard page, inline banner  
**Source**: `useAIInsights()` hook  
**Display**: Simple dismissible banner with list  
**Status**: ✅ Functional, uses real API

### Unused Component

**Location**: `components/dashboard/ai-insights.tsx`  
**Status**: ❌ Not imported in dashboard page  
**Issues**: Uses arbitrary purple/indigo colors, calls `generateDashboardInsights()` (likely doesn't exist)

**Decision**: Keep current inline implementation, remove unused component file

---

## 10. ACCESSIBILITY AUDIT

**Good** ✅:
- Semantic HTML where used
- Button elements for actions
- Icons with meaningful context
- Keyboard navigation works

**Missing** ⚠️:
- Dismiss button needs aria-label
- Charts lack accessible alternatives
- Loading state needs sr-only text
- Some interactive elements lack focus-visible

---

## 11. PERFORMANCE NOTES

**Good** ✅:
- React Query caching (60s refetch, 30s stale)
- Proper loading states
- Conditional rendering (AI insights)

**Concerns** ⚠️:
- Count-up animations on every render
- Stagger animations on large team lists
- Multiple chart renders

**Recommendation**: Keep animations, acceptable for dashboard

---

## 12. TRANSFORMATION PRIORITY

### Critical (Must Fix)
1. **Remove all inline hex/rgb colors** (7+10 instances)
2. **Migrate chart colors to tokens** (10 instances)
3. **Fix activity-feed color config** (15 violations)
4. **Wire/defer Quick Actions** (6 actions)
5. **Add error state**

### High (Should Fix)
6. **Replace arbitrary KPI colors** (5 instances)
7. **Fix hardcoded gray text** throughout
8. **Simplify WelcomeHero** (reduce decoration)
9. **Add global empty state**

### Medium (Nice to Have)
10. **Migrate Team table to Table component**
11. **Improve mobile chart behavior**
12. **Persist AI insights dismiss state**
13. **Add retry mechanism**

### Low (Optional)
14. **Remove unused ai-insights.tsx**
15. **Add more accessibility labels**
16. **Optimize animations**

---

## 13. FILES TO MODIFY

1. `apps/web/src/app/(dashboard)/dashboard/page.tsx` - Main page
2. `apps/web/src/components/dashboard/stat-card.tsx` - KPI cards
3. `apps/web/src/components/dashboard/activity-feed.tsx` - Activity timeline
4. `apps/web/src/components/dashboard/welcome-hero.tsx` - Hero section
5. `apps/web/src/components/dashboard/quick-actions.tsx` - FAB menu
6. ~~`apps/web/src/components/dashboard/ai-insights.tsx`~~ - DELETE (unused)

---

## 14. PRE-TRANSFORMATION VERIFICATION

✅ Build Status: **PASS** (verified in 2D.1)  
✅ Type Check: **PASS**  
✅ Data Sources: **Real APIs only**  
✅ Loading States: **Present**  
✅ Current Functionality: **Documented**  

**Ready to proceed**: ✅ YES

---

*Audit completed: 2026-08-04*  
*Proceeding to Phase 2D.2.2: Implementation*
