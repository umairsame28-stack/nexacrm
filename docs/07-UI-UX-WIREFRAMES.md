# UI/UX Wireframes & Design Specification
## NexaCRM — AI-Powered WhatsApp CRM SaaS

**Version:** 1.0 | **Date:** August 4, 2026

---

## 1. Design System Foundation

### 1.1 Design Tokens

```
─────────────────────────────────────────────────────────
COLORS — Light Mode
─────────────────────────────────────────────────────────
--background:          #ffffff       Page background
--background-subtle:   #f8fafc       Sidebar, cards
--background-muted:    #f1f5f9       Input fills, hover
--border:              #e2e8f0       Card borders, dividers
--border-strong:       #cbd5e1       Focused borders

--foreground:          #0f172a       Primary text
--foreground-muted:    #64748b       Secondary text, labels
--foreground-subtle:   #94a3b8       Placeholder, hints

--primary:             #6366f1       Indigo — primary actions
--primary-hover:       #4f46e5
--primary-foreground:  #ffffff
--primary-subtle:      #eef2ff       Chip backgrounds, highlights

--success:             #10b981       Green — won, delivered, active
--warning:             #f59e0b       Amber — pending, scheduled, warm
--danger:              #ef4444       Red — error, lost, urgent
--info:                #3b82f6       Blue — info states

--sidebar-bg:          #0f172a       Deep navy sidebar
--sidebar-fg:          #e2e8f0       Sidebar text
--sidebar-active:      #6366f1       Active nav item accent
--sidebar-hover:       #1e293b       Nav item hover

─────────────────────────────────────────────────────────
COLORS — Dark Mode
─────────────────────────────────────────────────────────
--background:          #0f172a
--background-subtle:   #1e293b
--background-muted:    #334155
--border:              #334155
--foreground:          #f1f5f9
--foreground-muted:    #94a3b8

─────────────────────────────────────────────────────────
TYPOGRAPHY
─────────────────────────────────────────────────────────
Font family:   Inter (primary), JetBrains Mono (code/monospace)
--text-xs:     12px / 1.5   — metadata, timestamps
--text-sm:     14px / 1.5   — body, labels, nav items
--text-base:   16px / 1.6   — default body
--text-lg:     18px / 1.5   — section headings
--text-xl:     20px / 1.4   — page titles
--text-2xl:    24px / 1.3   — large headings
--text-3xl:    30px / 1.2   — hero numbers (KPI cards)
Font weight:   400 regular · 500 medium · 600 semibold · 700 bold

─────────────────────────────────────────────────────────
SPACING (4px grid)
─────────────────────────────────────────────────────────
--space-1:  4px    --space-2:  8px    --space-3:  12px
--space-4:  16px   --space-5:  20px   --space-6:  24px
--space-8:  32px   --space-10: 40px   --space-12: 48px

─────────────────────────────────────────────────────────
BORDER RADIUS
─────────────────────────────────────────────────────────
--radius-sm:   6px    Inputs, small badges
--radius-md:   8px    Buttons, dropdowns
--radius-lg:   12px   Cards
--radius-xl:   16px   Modals, panels
--radius-full: 9999px Pills, avatars

─────────────────────────────────────────────────────────
SHADOWS
─────────────────────────────────────────────────────────
--shadow-sm:   0 1px 3px rgba(0,0,0,.08)    Card resting
--shadow-md:   0 4px 16px rgba(0,0,0,.12)   Dropdowns, popovers
--shadow-lg:   0 8px 32px rgba(0,0,0,.16)   Modals
--shadow-glow: 0 0 20px rgba(99,102,241,.3) Primary CTA hover

─────────────────────────────────────────────────────────
ANIMATION
─────────────────────────────────────────────────────────
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--duration-fast:   150ms    Hover transitions
--duration-normal: 250ms    Panel open/close
--duration-slow:   400ms    Page transitions, modals
```

### 1.2 Component Size Standards

```
Button heights:    sm=32px  md=40px  lg=48px
Input heights:     sm=32px  md=40px  lg=48px
Avatar sizes:      xs=24px  sm=32px  md=40px  lg=64px  xl=96px
Sidebar width:     expanded=256px   collapsed=64px
Top nav height:    64px
Page content max-width: 1440px
Card padding:      24px
Section gap:       24px
```

---

## 2. Global Shell Layout

### 2.1 AppShell (all dashboard pages)

```
┌─────────────────────────────────────────────────────────────┐
│ SIDEBAR (256px)    │ TOP NAV (full width, 64px tall)        │
│                    ├────────────────────────────────────────┤
│  ┌──────────────┐  │                                        │
│  │  Logo + Name │  │  PAGE CONTENT AREA                     │
│  └──────────────┘  │  (scrollable, padding 24px)            │
│                    │                                        │
│  ─── MAIN ───      │                                        │
│  🏠 Dashboard      │                                        │
│  👥 Contacts       │                                        │
│  💡 Leads          │                                        │
│  💼 Deals          │                                        │
│  💬 Inbox     (3)  │                                        │
│                    │                                        │
│  ─── TOOLS ───     │                                        │
│  ✓  Tasks          │                                        │
│  📅 Calendar       │                                        │
│  📊 Reports        │                                        │
│                    │                                        │
│  ─── ADMIN ───     │                                        │
│  👨‍💼 Team           │                                        │
│  ⚙  Settings       │                                        │
│                    │                                        │
│  ─────────────     │                                        │
│  [Avatar] Jane ▾  │                                        │
│  Acme Corp         │                                        │
└────────────────────┴────────────────────────────────────────┘

SIDEBAR NOTES:
- Deep navy (#0f172a) background
- Active item: left accent bar (3px) + subtle indigo bg
- Unread badge: rounded red pill (count) on Inbox item
- Collapsed state (64px): only icons, tooltips on hover
- Workspace switcher in footer (if user has multiple workspaces)
- Smooth slide transition on collapse/expand
```

### 2.2 Top Navigation Bar

```
┌─────────────────────────────────────────────────────────────┐
│ [≡]  Search CRM...  ⌘K        [🌙] [🔔]³  [?]  [Avatar▾]  │
└─────────────────────────────────────────────────────────────┘

COMPONENTS:
- [≡]       Hamburger toggle for sidebar collapse
- Search    Opens ⌘K command palette (AI-powered semantic search)
- [🌙]      Theme toggle (light/dark)
- [🔔]³     Notification bell with unread count badge
            → Click opens sliding notification drawer (right)
- [?]       Help & docs
- [Avatar▾] User menu: profile, switch workspace, logout

NOTIFICATION DRAWER (slides from right, 400px wide):
┌────────────────────────────────┐
│ Notifications          [Mark all read]
├────────────────────────────────┤
│ [🔵] New message from Maria G. │
│      "Yes, I'm interested..."  │
│      2 min ago                 │
├────────────────────────────────┤
│ [🟡] Task due in 1 hour        │
│      Follow up call with John  │
│      15 min ago                │
├────────────────────────────────┤
│ [🟢] Deal won — Acme Corp      │
│      $24,000 · Jane Doe        │
│      1 hour ago                │
└────────────────────────────────┘
```

---

## 3. Authentication Screens

### 3.1 Login Page

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   LEFT PANEL (50%)                RIGHT PANEL (50%)        │
│   ─────────────────────           ─────────────────────    │
│                                                             │
│   Gradient background             ┌─────────────────────┐  │
│   (#6366f1 → #7c3aed)             │   NexaCRM Logo      │  │
│                                   │                     │  │
│   Large headline:                 │  Welcome back       │  │
│   "Close more deals               │  Sign in to your    │  │
│    with AI-powered                │  account            │  │
│    conversations."                │                     │  │
│                                   │  [Email address   ] │  │
│   Feature bullets:                │  [Password        ] │  │
│   ✦ WhatsApp inbox                │                     │  │
│   ✦ AI reply suggestions          │  [Forgot password?] │  │
│   ✦ Smart lead scoring            │                     │  │
│                                   │  [   Sign In   ]    │  │
│   Testimonial quote card          │                     │  │
│   (glassmorphism style)           │  ──── or ────       │  │
│                                   │  [Continue w Google]│  │
│                                   │                     │  │
│                                   │  No account?        │  │
│                                   │  [Create one →]     │  │
│                                   └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

INTERACTION NOTES:
- Inline validation on blur (red border + message below)
- Password field has show/hide toggle
- Sign In button shows spinner on submit
- If requiresTOTP=true → slide to TOTP screen (no page reload)
- Mobile: left panel hidden, right panel full width
```

### 3.2 TOTP Screen (inline continuation)

```
┌─────────────────────┐
│  Two-Factor Auth    │
│                     │
│  Enter the 6-digit  │
│  code from your     │
│  authenticator app  │
│                     │
│  [  ][  ][  ][  ][  ][  ]  ← OTP input boxes (auto-focus)
│                     │
│  [  Verify Code  ]  │
│                     │
│  ← Back to login    │
└─────────────────────┘
```

---

## 4. Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                          │
│ Dashboard    Good morning, Jane 👋     [Aug 2026 ▾]  [Export PDF]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  KPI CARDS ROW (5 cards, equal width)                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Revenue  │ │Contacts  │ │  Active  │ │  Open    │ │Conversion│ │
│  │          │ │          │ │ Convs.   │ │  Leads   │ │  Rate    │ │
│  │ $284,000 │ │  4,823   │ │   142    │ │   312    │ │  45.8%   │ │
│  │ ↑18.1%   │ │ ↑12.4%   │ │  ↑8.2%  │ │  ↓3.1%  │ │  ↑2.3%  │ │
│  │ vs prev  │ │ vs prev  │ │ vs prev  │ │ vs prev  │ │ vs prev  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                      │
│  ROW 2: Charts                                                       │
│  ┌────────────────────────────────┐  ┌────────────────────────────┐ │
│  │ Monthly Revenue Trend          │  │ Conversion Funnel          │ │
│  │ (line chart, 12 months)        │  │                            │ │
│  │ ████████████████████▄▄▄▄▄▄    │  │ Leads    ████████  1,240  │ │
│  │                                │  │ Qualified ██████    640   │ │
│  │ [7d][30d][90d][1y]             │  │ Proposal  ████      312   │ │
│  └────────────────────────────────┘  │ Won       ██        142   │ │
│                                       └────────────────────────────┘ │
│  ROW 3: Table + Feed                                                 │
│  ┌────────────────────────────────┐  ┌────────────────────────────┐ │
│  │ Team Performance               │  │ Activity Feed              │ │
│  │ Agent    Convs  Deals  AvgResp │  │ ● Jane won deal $24K  2m  │ │
│  │ Jane D.   84     8    12.4m   │  │ ● Maria sent message  5m  │ │
│  │ Carlos    71     6    18.2m   │  │ ● Lead "TechCo" →Qual 12m │ │
│  │ Sarah     56     4    22.1m   │  │ ● 5 contacts imported 1h  │ │
│  │ [View all]                     │  │ [Load more...]             │ │
│  └────────────────────────────────┘  └────────────────────────────┘ │
│                                                                      │
│  ROW 4: Calendar widget + Upcoming tasks                             │
│  ┌────────────────────────────────┐  ┌────────────────────────────┐ │
│  │ Today — Aug 4, 2026            │  │ Upcoming Tasks             │ │
│  │ 10:00  Demo — Acme Corp        │  │ ⚡ Follow-up call Maria DUE│ │
│  │ 14:00  Review pipeline         │  │ 🟡 Send proposal: TechCo   │ │
│  │ 15:30  Team standup            │  │ 🔴 Contract: Globex Corp   │ │
│  │ [Open calendar]                │  │ [View all tasks]           │ │
│  └────────────────────────────────┘  └────────────────────────────┘ │
│                                                                      │
│  AI INSIGHTS BANNER (collapsible)                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ 🤖 AI Insights · Aug 4, 2026                          [✕ Hide] ││
│  │ • Revenue is up 18% — driven by 3 enterprise deals in pipeline  ││
│  │ • 4 high-value leads went cold this week. Re-engage now.        ││
│  │ • Avg response time improved by 32% — great work this week!     ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘

DESIGN NOTES:
- KPI cards: rounded-lg, subtle shadow, trend arrow colored green/red
- Numbers use tabular-nums, 30px font weight 700
- Charts built with Recharts, themed to match CSS vars
- Activity feed: real-time WebSocket updates (new items slide in from top)
- AI insights banner: gradient left border (indigo → purple), dismissable
- All cards support dark mode via CSS variable swap
```

---

## 5. Contacts Module

### 5.1 Contacts List Page

```
┌─────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                          │
│ Contacts (4,823)         [🔍 Search...]  [Filters ▾] [Import] [+ Add]│
├──────────────────────────────────────────────────────────────────────┤
│ FILTER BAR (when Filters is open, slides down)                       │
│ [Status ▾] [Tags ▾] [Assigned to ▾] [Source ▾] [Date range ▾] [Clear]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ DATA TABLE                                                           │
│ ┌──┬─────────────────┬──────────────┬───────────┬──────────┬──────┐ │
│ │☐ │ Name            │ Phone        │ Company   │ Tags     │      │ │
│ ├──┼─────────────────┼──────────────┼───────────┼──────────┼──────┤ │
│ │☐ │ 🟢 Maria Garcia │+55 11 9999..│ TechCorp  │[VIP][Hot]│ ···  │ │
│ │☐ │ 🔵 John Smith   │+1 415 555.. │ Acme Inc  │[Enterprise]│ ···│ │
│ │☐ │ 🟡 Carlos Silva │+52 55 1234..│ Globex    │[Follow-up]│ ···│ │
│ └──┴─────────────────┴──────────────┴───────────┴──────────┴──────┘ │
│                                                                      │
│ BULK ACTIONS BAR (appears when rows selected):                       │
│ [3 selected]  [Add tag]  [Assign to]  [Export]  [Delete]             │
│                                                                      │
│ PAGINATION:  ← Previous   Page 1 of 193   Next →  [25 per page ▾]   │
└─────────────────────────────────────────────────────────────────────┘

ROW ACTIONS (··· hover menu):
  View detail | Edit | Add note | Start conversation | Delete
```

### 5.2 Contact Detail Page (right-side layout)

```
┌────────────────────────────────────────────────────────────────────┐
│ ← Contacts                                        [Edit] [···]     │
├──────────────────────────────┬─────────────────────────────────────┤
│ LEFT PANEL (360px fixed)     │ RIGHT PANEL (timeline + tabs)       │
│                              │                                     │
│ [Large Avatar]               │ TABS: [Timeline][Notes][Deals][Tasks]│
│ Maria Garcia                 ├─────────────────────────────────────┤
│ TechCorp · CTO               │ TIMELINE (newest first)             │
│ +55 11 99999-8888            │                                     │
│ maria@techcorp.com           │ Aug 4 — Message sent                │
│                              │  "Following up on your question..." │
│ [💬 Start Chat] [+ Add Task] │                                     │
│                              │ Aug 2 — Deal created                │
│ ── DETAILS ──                │  Enterprise Plan · $24,000          │
│ Status:   🟢 Active          │                                     │
│ Source:   WhatsApp           │ Jul 28 — Note added                 │
│ Assigned: Jane Doe           │  "Very interested in Pro tier..."   │
│ Created:  Jan 15, 2026       │                                     │
│                              │ Jul 20 — Lead qualified             │
│ ── TAGS ──                   │  Score: 88 · Pipeline: Enterprise   │
│ [VIP ×][Hot Lead ×] [+ Tag]  │                                     │
│                              │ Jul 15 — Contact created            │
│ ── CUSTOM FIELDS ──          │  Source: WhatsApp inbound           │
│ MRR:        $5,000           │                                     │
│ Industry:   SaaS             │                                     │
│ Team size:  50-200           │                                     │
│                              │                                     │
└──────────────────────────────┴─────────────────────────────────────┘
```

### 5.3 Create / Edit Contact Drawer

```
SLIDES IN FROM RIGHT (480px wide sheet)

┌──────────────────────────────────────┐
│ New Contact                    [✕]   │
├──────────────────────────────────────┤
│                                      │
│ First name *    [              ]     │
│ Last name       [              ]     │
│ Phone *         [+1 (555) ···  ]     │
│ Email           [              ]     │
│ Company         [              ]     │
│ Job title       [              ]     │
│                                      │
│ Source          [WhatsApp      ▾]    │
│ Assign to       [Select agent  ▾]    │
│                                      │
│ Tags            [Select tags   ▾]    │
│ (renders tag chips inline)           │
│                                      │
│ ── Custom Fields ──                  │
│ MRR             [              ]     │
│ Industry        [              ]     │
│                                      │
│ Notes           [                ]   │
│                 [                ]   │
│                                      │
│ [Cancel]              [Save Contact] │
└──────────────────────────────────────┘
```

---

## 6. Leads — Kanban Board

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                               │
│ Leads        [Pipeline: Inbound Sales ▾]    [🔍] [Filters] [List] [+ Add]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  KANBAN COLUMNS (horizontally scrollable)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ NEW    (24) │  │CONTACTED(18)│  │QUALIFIED(12)│  │PROPOSAL (8) │    │
│  │ ─────────── │  │ ─────────── │  │ ─────────── │  │ ─────────── │    │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │    │
│  │ │Maria G. │ │  │ │John S.  │ │  │ │TechCorp │ │  │ │Acme Inc │ │    │
│  │ │Enterprise│ │  │ │Mid-mkt │ │  │ │$12K/mo  │ │  │ │$24K deal│ │    │
│  │ │Score: 88│ │  │ │Score: 72│ │  │ │Score: 91│ │  │ │Score: 95│ │    │
│  │ │🏷 VIP   │ │  │ │🏷 Warm  │ │  │ │🏷 Hot   │ │  │ │🏷 Hot   │ │    │
│  │ │Jane Doe │ │  │ │Carlos   │ │  │ │Sarah    │ │  │ │Jane Doe │ │    │
│  │ │3d ago   │ │  │ │1d ago   │ │  │ │2h ago   │ │  │ │5h ago   │ │    │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │    │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │             │    │
│  │ │Carlos S.│ │  │ │Ana M.   │ │  │ │          │ │  │ [+ Add lead]│    │
│  │ │SMB      │ │  │ │Startup  │ │  │ └─────────┘ │  │             │    │
│  │ │Score: 55│ │  │ │Score: 61│ │  │             │  │             │    │
│  │ └─────────┘ │  │ └─────────┘ │  │             │  │             │    │
│  │             │  │             │  │             │  │             │    │
│  │ [+ Add]     │  │ [+ Add]     │  │ [+ Add]     │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘

KANBAN CARD DESIGN:
- White card, rounded-lg, shadow-sm
- Hover: shadow-md, slight translate-y(-2px) lift
- Drag: opacity 0.85, scale(1.02), drop shadow-lg
- Drop zone: dashed border, background-subtle highlight
- Score badge: colored pill (🔴>80 hot, 🟡50-80 warm, ⚪<50 cold)
- Assignee: small avatar circle (24px) bottom-right

COLUMN HEADER:
- Stage name + count in muted text
- Column color dot (matches pipeline stage color)
- Summed deal value below count (if scoring enabled)
```

### Lead Detail Side Sheet (click on card)

```
SLIDES IN FROM RIGHT (560px)

┌──────────────────────────────────────────┐
│ Enterprise Demo Request           [✕]    │
│ TechCorp · Maria Garcia                  │
├──────────────────────────────────────────┤
│ LEAD STAGE:  [New → Contacted → ✓Qual → Proposal]
│                             (clickable stage pills)
│                                          │
│ Score: [████████░░] 88/100   [🤖 Qualify]│
│ Source: WhatsApp    Assigned: Jane Doe   │
│                                          │
│ Follow-up: Aug 5, 09:00  [Edit]          │
│                                          │
│ ── CONTACT ──────────────────────────── │
│ [Avatar] Maria Garcia                    │
│ +55 11 99999-8888  ·  maria@techcorp.com│
│ [View full contact →]                   │
│                                          │
│ ── ACTIVITY ──────────────────────────  │
│ • Stage changed → Qualified   (Jane, 2h)│
│ • Score updated: 72 → 88      (AI, 2h) │
│ • Lead created                (Jane, 3d)│
│                                          │
│ ── NOTES ───────────────────────────── │
│ [Add note...]              [Save]        │
│                                          │
│ [Convert to Deal]  [Assign]  [Delete]   │
└──────────────────────────────────────────┘
```

---

## 7. WhatsApp Inbox

### 7.1 Two-Panel Inbox Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│ INBOX LAYOUT  (full height, no outer scroll)                           │
├────────────────────────┬───────────────────────────┬───────────────────┤
│ LEFT PANEL (320px)     │ CENTER — CHAT WINDOW       │ RIGHT PANEL       │
│                        │ (flex-grow)                │ (300px, toggle)   │
│ ┌────────────────────┐ │                            │                   │
│ │[🔍 Search convs..]│ │ ┌──────────────────────┐  │ ── CONTACT ──     │
│ └────────────────────┘ │ │ CHAT HEADER          │  │ [Avatar 64px]     │
│ [All][Open][Pending]   │ │ [Avatar] Maria Garcia│  │ Maria Garcia      │
│ [Resolved][Archived]   │ │ +55 11 99999-8888    │  │ TechCorp · CTO    │
│ ─────────────────────  │ │ 🟢 Online            │  │                   │
│                        │ │  [Assign▾][Label▾][⋮]│  │ Phone: +55...     │
│ CONVERSATION ITEMS:    │ └──────────────────────┘  │ Email: maria@...  │
│                        │                            │                   │
│ ┌──────────────────┐   │  MESSAGE LIST (scrollable)│ ── LABELS ──      │
│ │🟢 Maria Garcia ●3│   │                            │ [VIP][Hot Lead]   │
│ │Yes, I'm interes..│   │  Aug 4, 2:00 PM            │                   │
│ │2m · 🏷VIP        │   │  ┌────────────────────┐    │ ── RELATED ──     │
│ └──────────────────┘   │  │ Hello, I saw your  │    │ Leads (1)         │
│ ┌──────────────────┐   │  │ ad on Instagram... │    │ • Enterprise Demo │
│ │🔵 John Smith     │   │  └────────────────────┘    │                   │
│ │Can we schedule...│   │                             │ Deals (1)         │
│ │1h                │   │  ┌────────────────────────┐│ • $24K Enterprise │
│ └──────────────────┘   │  │ Hi Maria! Thanks for ││ │                   │
│ ┌──────────────────┐   │  │ reaching out. How can ││ Tasks (2)         │
│ │🟡 Carlos Silva   │   │  │ I help you?        ✓✓││ • Send proposal   │
│ │I'll check on...  │   │  └────────────────────────┘│ • Follow-up call  │
│ │3h                │   │                             │                   │
│ └──────────────────┘   │  [INBOUND] Aug 4, 2:22 PM  │ [+ Add task]     │
│                        │  ┌────────────────────┐     │                   │
│ [Load more]            │  │ Yes, I'm interested │     │ ── NOTES ──      │
│                        │  │ in the Pro plan!   │     │ [Internal note..]│
│                        │  └────────────────────┘     │                   │
│                        │                             │                   │
│                        │ ┌──────────────────────┐   │                   │
│                        │ │ MESSAGE COMPOSER     │   │                   │
│                        │ │                      │   │                   │
│                        │ │ [Type a message...  ]│   │                   │
│                        │ │                      │   │                   │
│                        │ │[😊][📎][⚡][🤖][📅][➤]│   │                   │
│                        │ └──────────────────────┘   │                   │
├────────────────────────┴───────────────────────────┴───────────────────┤
│ COMPOSER ACTION ICONS:                                                  │
│ 😊 Emoji picker   📎 File attach   ⚡ Quick replies                    │
│ 🤖 AI suggest     📅 Schedule      ➤ Send                              │
└────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Message Bubble Design

```
INBOUND (customer):
┌──────────────────────────────────────┐
│[Avatar]  ┌─────────────────────────┐ │
│          │ Message text here       │ │
│          │ 2:22 PM                 │ │
│          └─────────────────────────┘ │
└──────────────────────────────────────┘
  background: --background-muted
  border-radius: 0 12px 12px 12px

OUTBOUND (agent):
┌──────────────────────────────────────┐
│  ┌─────────────────────────┐ [Avatar]│
│  │ Message text here       │         │
│  │ 2:05 PM  ✓✓             │         │
│  └─────────────────────────┘         │
└──────────────────────────────────────┘
  background: --primary-subtle
  border-radius: 12px 0 12px 12px
  ✓ sent  ✓✓ delivered  ✓✓(blue) read

MEDIA MESSAGE (image):
┌────────────────────────┐
│ [Image thumbnail       │
│  with expand icon]     │
│                        │
│ Caption text here      │
│ 2:10 PM  ✓✓            │
└────────────────────────┘
  Hover: brightness overlay + 🔍 zoom icon
  Click: opens full-screen lightbox

INTERNAL NOTE:
┌──────────────────────────────────────────┐
│ 🔒 Internal note · Jane Doe · 14:30      │
│ ─────────────────────────────────────── │
│ Customer seems very close to converting. │
│ Handle with care — do not mention pricing│
│ until they ask.                          │
└──────────────────────────────────────────┘
  background: amber-50, left border amber-400
  Not visible to customer, labeled clearly

AI SUGGESTION PANEL (above composer):
┌─────────────────────────────────────────────────┐
│ 🤖 AI Suggestions                    [✕ Dismiss]│
│ ─────────────────────────────────────────────── │
│ ┌───────────────────────────────────────────┐   │
│ │ Thanks for your interest! I'd love to     │   │
│ │ schedule a quick demo for you.   [Use →]  │   │
│ └───────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────┐   │
│ │ Our Pro plan includes everything you need.│   │
│ │ Shall I send the pricing details? [Use →] │   │
│ └───────────────────────────────────────────┘   │
│ [Regenerate ↺]                                  │
└─────────────────────────────────────────────────┘
```

---

## 8. Deals Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Deals        [Pipeline: Enterprise ▾]     [Forecast] [List] [+ New Deal]│
├─────────────────────────────────────────────────────────────────────────┤
│ PIPELINE SUMMARY BAR                                                     │
│ Total: $510,000  ·  Weighted: $234,000  ·  22 open deals  ·  45.8% avg │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ KANBAN (same pattern as leads, with deal-specific data)                 │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ DISCOVERY (6) │  │PROPOSAL  (8)  │  │NEGOT.(4) │  │CONTRACT  (4) │  │
│  │   $42,000     │  │  $85,000      │  │ $48,000  │  │  $96,000     │  │
│  │ ────────────  │  │ ────────────  │  │ ───────  │  │ ────────── │  │
│  │ ┌───────────┐ │  │ ┌───────────┐ │  │          │  │ ┌──────────┐│  │
│  │ │Acme Corp  │ │  │ │TechCorp   │ │  │          │  │ │Globex    ││  │
│  │ │$24,000    │ │  │ │$48,000    │ │  │          │  │ │$36,000   ││  │
│  │ │Close: Sep │ │  │ │Close: Aug │ │  │          │  │ │Close: Aug││  │
│  │ │Jane · 70% │ │  │ │Sarah · 80%│ │  │          │  │ │Jane · 90%││  │
│  │ └───────────┘ │  │ └───────────┘ │  │          │  │ └──────────┘│  │
│  └───────────────┘  └───────────────┘  └──────────┘  └──────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

DEAL CARD additions vs Lead card:
- Deal value (bold, primary color)
- Expected close date with urgency coloring (red if past due)
- Win probability percentage
- Progress bar: value/stage probability
```

### Deals Forecast View

```
┌─────────────────────────────────────────────────────┐
│ Revenue Forecast · Enterprise Pipeline · Aug 2026   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  FORECAST BAR CHART (stacked by pipeline stage)    │
│  $400K ┤                                           │
│  $300K ┤        ██████████                         │
│  $200K ┤  ██████████████████                       │
│  $100K ┤████████████████████████████               │
│     $0 └───────────────────────────────────────    │
│         Aug     Sep     Oct     Nov     Dec         │
│         ■ Closed Won  ■ Weighted  ■ Pipeline        │
│                                                     │
├──────────────────┬──────────┬───────────┬──────────┤
│ Stage            │ Deals    │ Total $   │ Weighted  │
├──────────────────┼──────────┼───────────┼──────────┤
│ Discovery        │    6     │  $42,000  │  $16,800 │
│ Proposal         │    8     │  $85,000  │  $68,000 │
│ Negotiation      │    4     │  $48,000  │  $43,200 │
│ Contract         │    4     │  $96,000  │  $86,400 │
├──────────────────┼──────────┼───────────┼──────────┤
│ TOTAL            │   22     │  $271,000 │ $214,400 │
└──────────────────┴──────────┴───────────┴──────────┘
```

---

## 9. Tasks & Calendar

### 9.1 Tasks Page (Kanban View)

```
┌─────────────────────────────────────────────────────────────────┐
│ Tasks        [My Tasks ▾]   [Kanban][List][Calendar]  [+ Task]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  TODO  (12)  │  │IN PROGRESS(5)│  │  DONE   (28) │          │
│  │ ──────────── │  │ ──────────── │  │ ──────────── │          │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │          │
│  │ │⚡ URGENT │ │  │ │🟡 HIGH   │ │  │ │✓ Send    │ │          │
│  │ │Follow up │ │  │ │Prepare   │ │  │ │  proposal│ │          │
│  │ │call Maria│ │  │ │demo deck │ │  │ │          │ │          │
│  │ │Due: TODAY│ │  │ │Due: Aug5 │ │  │ │Aug 3     │ │          │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Full Calendar Page

```
┌─────────────────────────────────────────────────────────────────┐
│ Calendar        [← Aug 2026 →]     [Month][Week][Day] [+ Event] │
├────────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────────┤
│        │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │             │
│ Week 1 │  3   │  4   │  5   │  6   │  7   │  8   │             │
│        │      │🟣Demo│      │      │      │      │             │
│        │      │14:00 │      │      │      │      │             │
│        │      │      │      │      │      │      │             │
│ Week 2 │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │             │
│        │      │      │🔵Call│      │      │      │             │
│        │      │      │10:00 │      │      │      │             │
└────────┴──────┴──────┴──────┴──────┴──────┴──────┴─────────────┘

EVENT POPOVER (click on event):
┌────────────────────────────────────┐
│ Product Demo — Acme Corp    [Edit] │
│ 🟣  Aug 5, 14:00–15:00             │
│ 📍  Zoom (link copied)             │
│ 👥  Jane Doe + Maria Garcia        │
│ 🔗  Deal: Enterprise Plan          │
│ [Open deal]            [Delete]    │
└────────────────────────────────────┘
```

---

## 10. Reports

```
┌───────────────────────────────────────────────────────────────────┐
│ Reports                          [Jul 1–Jul 31 ▾]  [Export PDF]   │
├───────────────────────────────────────────────────────────────────┤
│ REPORT TABS: [Sales][Revenue][Agent Perf.][Pipeline][WhatsApp]    │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│ SALES REPORT                                                       │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Won Deals│  │Lost Deals│  │ Revenue  │  │ Win Rate │         │
│  │    22    │  │    14    │  │ $284,000 │  │  44.1%   │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Deals Won/Lost by Day (grouped bar chart)                │    │
│  │ ████ Won  ░░░░ Lost                                      │    │
│  │ ████████████████████▄▄▄▄▄████████████████████            │    │
│  │ Jul 1                    Jul 15                Jul 31    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  BY AGENT TABLE:                                                   │
│  ┌──────────────┬──────┬──────┬───────────┬──────────┐          │
│  │ Agent        │ Won  │ Lost │ Revenue   │ Win Rate │          │
│  ├──────────────┼──────┼──────┼───────────┼──────────┤          │
│  │ Jane Doe     │  8   │  4   │  $98,000  │  66.7%   │          │
│  │ Carlos Silva │  6   │  5   │  $74,000  │  54.5%   │          │
│  │ Sarah Kim    │  4   │  3   │  $52,000  │  57.1%   │          │
│  └──────────────┴──────┴──────┴───────────┴──────────┘          │
└───────────────────────────────────────────────────────────────────┘
```

---

## 11. Settings Pages

### 11.1 Settings Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ SETTINGS LAYOUT (settings sub-sidebar + content panel)           │
├──────────────────┬──────────────────────────────────────────────┤
│ SETTINGS NAV     │ CONTENT AREA                                  │
│ (220px)          │                                               │
│                  │ ┌────────────────────────────────────────┐   │
│ ── WORKSPACE ──  │ │ WhatsApp Integration                   │   │
│ Company profile  │ │                                        │   │
│ Branding         │ │ ⚠️ Not connected                       │   │
│                  │ │                                        │   │
│ ── INTEGRATIONS──│ │ Phone Number ID                        │   │
│ ▶ WhatsApp ●     │ │ [                                 ]   │   │
│   AI Provider    │ │                                        │   │
│   Email (SMTP)   │ │ Access Token                           │   │
│   API Keys       │ │ [●●●●●●●●●●●●●●●●●●●●●●●●   👁]   │   │
│                  │ │                                        │   │
│ ── SECURITY ──   │ │ Webhook Secret                         │   │
│   Two-Factor     │ │ [                                 ]   │   │
│   Sessions       │ │                                        │   │
│   IP Whitelist   │ │ Webhook URL (read-only, copy)          │   │
│                  │ │ [https://api.nexacrm.io/webhooks/  📋]│   │
│ ── TEAM ──       │ │                                        │   │
│   Members        │ │ [  Test Connection  ]  [  Save  ]      │   │
│   Departments    │ │                                        │   │
│   Teams          │ │ ✅ Connected to +1 (415) 555-xxxx     │   │
│                  │ │    Display: Acme Corp Support          │   │
│ ── ACCOUNT ──    │ └────────────────────────────────────────┘   │
│   Audit log      │                                               │
│   Data export    │                                               │
└──────────────────┴──────────────────────────────────────────────┘
```

---

## 12. Empty States

Every list and data view has a contextual empty state:

```
CONTACTS EMPTY STATE:
┌─────────────────────────────────────────────┐
│                                             │
│          [Illustration: people + phone]     │
│                                             │
│          No contacts yet                   │
│          Start building your contact list  │
│          to manage your customer base.     │
│                                             │
│    [Import from CSV]    [Add first contact]│
│                                             │
└─────────────────────────────────────────────┘

INBOX EMPTY STATE (no conversations):
┌─────────────────────────────────────────────┐
│          [Illustration: chat bubbles]        │
│                                             │
│     No conversations yet                   │
│     Connect WhatsApp to start receiving    │
│     messages from your customers.          │
│                                             │
│           [Configure WhatsApp]             │
└─────────────────────────────────────────────┘

FILTER EMPTY STATE (no results):
┌─────────────────────────────────────────────┐
│          [Illustration: search/filter]       │
│                                             │
│     No results match your filters          │
│     Try adjusting your search or           │
│     removing some filters.                 │
│                                             │
│              [Clear filters]               │
└─────────────────────────────────────────────┘
```

---

## 13. Loading States

```
SKELETON CARDS (dashboard):
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ ████████      │ │ ████████      │ │ ████████      │
│               │ │               │ │               │
│ ████████████  │ │ ████████████  │ │ ████████████  │
│ ████          │ │ ████          │ │ ████          │
└───────────────┘ └───────────────┘ └───────────────┘
(shimmer animation: background gradient sweeping left→right)

TABLE SKELETON:
┌────────────────────────────────────────────────────┐
│ ████████  ████████████████  ████████  ██████       │
│ ████████  ████████████████  ████████  ██████       │
│ ████████  ████████████████  ████████  ██████       │
└────────────────────────────────────────────────────┘

CONVERSATION SKELETON (inbox):
[Circle] ████████████  ██████████
         ████████████████
[Circle] ████████████  ██████████
         ████████████████
```

---

## 14. Toast Notifications

```
SUCCESS (top-right, slides in):
┌────────────────────────────────────────┐
│ ✅  Contact saved successfully          │
│     Maria Garcia was added to Acme CRM │ [✕]
└────────────────────────────────────────┘
Background: success-50, left border success, auto-dismiss 4s

ERROR:
┌────────────────────────────────────────┐
│ ❌  Failed to send message              │
│     Meta API returned error 130472    │ [✕][Retry]
└────────────────────────────────────────┘

WARNING:
┌────────────────────────────────────────┐
│ ⚠️  Duplicate contact detected          │
│     A contact with this phone exists. │ [✕][Merge →]
└────────────────────────────────────────┘

INFO:
┌────────────────────────────────────────┐
│ ℹ️  Import in progress                  │
│     4,523 contacts are being imported │ [✕][View progress]
└────────────────────────────────────────┘
```

---

## 15. Mobile Responsive Behavior

```
BREAKPOINTS:
  sm:  640px  — Mobile landscape
  md:  768px  — Tablet portrait
  lg:  1024px — Tablet landscape / small laptop
  xl:  1280px — Desktop
  2xl: 1536px — Large desktop

SIDEBAR:
  < lg:  Hidden by default, opens as overlay on hamburger tap
  ≥ lg:  Pinned, collapsible with toggle

INBOX (two-panel):
  < md:  Stack vertically — list is full screen,
         tapping a conversation navigates to chat (back button)
  ≥ md:  Side-by-side panels

KANBAN:
  < md:  Horizontal scroll with snap
  ≥ md:  Fixed columns visible

TABLES:
  < md:  Card-based list view replaces table rows
  ≥ md:  Standard data table

BOTTOM NAV (mobile only, < md):
┌──────────────────────────────────────────┐
│ 🏠 Dash  👥 Contacts  💬 Inbox  ✓ Tasks │
└──────────────────────────────────────────┘
```

---

## 16. Dark Mode

All CSS custom properties are swapped at the `:root[data-theme="dark"]` selector level. No component-level dark mode overrides are needed — every component uses the token system exclusively.

```
Key dark mode changes:
- --background: #0f172a (from #ffffff)
- --background-subtle: #1e293b (from #f8fafc)
- --sidebar-bg remains #0f172a (same — sidebar already dark)
- Card backgrounds: #1e293b
- Input fills: #334155
- Text: #f1f5f9
- Borders: #334155
- Charts: axes/grid use --foreground-muted (#94a3b8)

Glassmorphism elements (KPI cards in dark mode):
  background: rgba(30, 41, 59, 0.7)
  backdrop-filter: blur(12px)
  border: 1px solid rgba(255,255,255,0.08)
```
