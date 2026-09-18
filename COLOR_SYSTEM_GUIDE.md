# NexaCRM Color System Guide

## Design Philosophy
Professional, accessible, purple-branded SaaS CRM with limited yellow accents.

## Color Hierarchy

### PRIMARY (Purple/Indigo)
- **Usage**: Primary brand, main actions, active states, primary buttons
- **Color**: `#6C5CE7` (108, 92, 231)
- **Accent**: `#8B5CF6` (139, 92, 246)
- **Text on primary**: White (#FFFFFF)

**Examples**:
- Primary action buttons
- Active navigation items
- Selected states
- Focus rings
- Brand elements

### SUCCESS (Emerald Green)
- **Usage**: Success states, active connections, completed tasks
- **Color**: `#10B981` (16, 185, 129)
- **Background**: Light tint `rgba(16, 185, 129, 0.15)`
- **Text**: Dark green on light bg, White on solid bg

**Examples**:
- Success messages
- "Connected" status
- Completed badges
- Positive metrics

### DESTRUCTIVE (Red)
- **Usage**: Errors, destructive actions, failed states
- **Color**: `#EF4444` (239, 68, 68)
- **Background**: Light tint `rgba(239, 68, 68, 0.15)`
- **Text**: Dark red on light bg, White on solid bg

**Examples**:
- Delete buttons
- Error messages
- Failed status
- Critical warnings

### WARNING (Amber) - LIMITED USE
- **Usage**: ONLY for warnings, attention needed, pending states
- **Color**: `#F59E0B` (245, 158, 11)
- **Background**: Light amber `#FEF3C7` or `#FFFBEB`
- **Text**: DARK brown `#92400E` (NEVER white on yellow)
- **Border**: Medium amber `#FCD34D`

**IMPORTANT**: 
- DO NOT use as default background color
- DO NOT use for large areas
- ALWAYS use dark text on yellow backgrounds
- Use sparingly for semantic meaning only

**Examples**:
- Warning alerts (small badges/banners)
- Pending review status
- Attention indicators
- Caution messages

### INFO (Blue)
- **Usage**: Informational states, neutral information
- **Color**: `#3B82F6` (59, 130, 246)
- **Background**: Light blue `#DBEAFE`
- **Text**: Dark blue `#1E40AF` or White on solid

**Examples**:
- Info messages
- Help tooltips
- Neutral status
- Informational badges

### NEUTRAL (Gray Scale)
**Primary Text**: `#111827` (17, 24, 39) - Dark gray/navy
**Secondary Text**: `#4B5563` (75, 85, 99) - Medium gray
**Muted Text**: `#6B7280` (107, 114, 128) - Light gray
**Border**: `#E5E7EB` (229, 231, 235) - Very light gray
**Background**: `#F8FAFC` (248, 250, 252) - Off-white
**Card Background**: `#FFFFFF` - Pure white

## Component Color Usage

### Buttons
```tsx
<Button variant="default">Primary Action</Button>        // Purple
<Button variant="secondary">Secondary</Button>           // Light gray
<Button variant="outline">Outlined</Button>              // White with border
<Button variant="destructive">Delete</Button>            // Red
<Button variant="success">Approve</Button>               // Green
<Button variant="warning">Review</Button>                // Amber with dark text
<Button variant="info">Learn More</Button>               // Blue
<Button variant="ghost">Subtle</Button>                  // Transparent
```

### Badges
```tsx
<Badge variant="default">New</Badge>                     // Purple
<Badge variant="success">Active</Badge>                  // Light green bg, dark green text
<Badge variant="destructive">Failed</Badge>              // Light red bg, dark red text
<Badge variant="warning">Pending</Badge>                 // Light amber bg, dark amber text
<Badge variant="info">Info</Badge>                       // Light blue bg, dark blue text
<Badge variant="outline">Custom</Badge>                  // Bordered
<Badge variant="muted">Inactive</Badge>                  // Gray
```

### Inputs
- Background: White or very light gray (#FFFFFF or #F9FAFB)
- Border: `#E5E7EB` (visible but subtle)
- Focus: Purple ring and border
- Text: Dark `#111827`
- Placeholder: Medium gray `#6B7280`

## Page-Specific Guidelines

### Dashboard
- White cards with subtle shadows
- Purple primary actions
- Emerald green for revenue/success metrics
- Dark readable text
- NO large yellow areas

### Tables (Contacts, Leads, Deals, Team)
- White background
- Dark text `#111827`
- Light gray borders `#E5E7EB`
- Subtle row hover: `#F9FAFB`
- Status badges with semantic colors
- NO yellow table backgrounds

### Kanban Boards (Leads, Deals)
- Column backgrounds: White or very light gray
- Drop zones: Subtle purple tint on hover
- Status indicated by small colored dots/badges
- NO large colored column backgrounds

### Inbox
- Conversation list: White background
- Selected: Light purple highlight
- Unread indicator: Small purple dot
- Message text: Dark readable
- NO yellow conversation areas

### Calendar
- White cells
- Subtle gray borders
- Today: Purple outline
- Events: Semantic colors (small blocks)
- Readable dark text

### Charts & Reports
- Background: White
- Primary line/bar: Purple
- Secondary data: Blue, green, etc.
- Axis labels: Dark gray `#6B7280`
- Gridlines: Very light gray `#F1F5F9`
- NO pale gray text

### Settings
- White input backgrounds
- Dark labels
- Purple primary save buttons
- Visible borders
- Clear section separation

## Accessibility Standards

### Contrast Ratios (WCAG AA)
- Normal text: minimum 4.5:1
- Large text (18pt+): minimum 3:1
- UI components: minimum 3:1

### Approved Combinations
✅ Dark text (#111827) on white
✅ White text on purple (#6C5CE7)
✅ White text on blue (#3B82F6)
✅ White text on green (#10B981)
✅ White text on red (#EF4444)
✅ Dark amber text (#92400E) on light amber (#FEF3C7)
✅ Medium gray (#6B7280) on white (for secondary text)

### Avoid
❌ White text on yellow/amber
❌ Light gray (#E5E7EB) text on white
❌ Low contrast combinations
❌ Yellow as primary background color

## DO NOT
1. ❌ Use bright yellow (#FFFF00) as background
2. ❌ Use yellow for entire page sections
3. ❌ Use yellow for table backgrounds
4. ❌ Use yellow for input backgrounds
5. ❌ Use yellow for navigation backgrounds
6. ❌ Use white or light text on yellow
7. ❌ Make text so light it's hard to read
8. ❌ Use excessive colors that compete with content

## DO
1. ✅ Use purple for primary brand/actions
2. ✅ Use white/light gray for main backgrounds
3. ✅ Use dark text for maximum readability
4. ✅ Use yellow sparingly for warnings only
5. ✅ Ensure all text meets contrast standards
6. ✅ Use semantic colors consistently
7. ✅ Keep the interface clean and professional
8. ✅ Test in both light and dark modes
