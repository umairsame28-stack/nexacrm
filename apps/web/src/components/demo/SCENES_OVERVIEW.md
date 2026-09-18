# Scrollytelling Demo - Scenes Overview

Visual guide to all 9 scenes in the NexaCRM scrollytelling demo.

---

## Scene 1: Welcome & Dashboard Loading
**Duration**: First scroll
**Background**: Indigo/Purple gradient with animated orbs

### Layout
```
┌─────────────────────────────────────────┐
│         Welcome to NexaCRM              │
│  Experience the future of customer...   │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │ Browser Chrome (dots + URL bar)   │  │
│  │ ┌────────┬─────────────────────┐  │  │
│  │ │Sidebar │  Dashboard          │  │  │
│  │ │        │  ┌──┬──┬──┬──┐      │  │  │
│  │ │ • Dash │  │📊│📈│✓│💰│ Stats │  │  │
│  │ │ • Leads│  └──┴──┴──┴──┘      │  │  │
│  │ │ • Cont │  ┌────┬────┐        │  │  │
│  │ │ • Deals│  │📊  │🍩  │ Charts│  │  │
│  │ │ • Tasks│  └────┴────┘        │  │  │
│  │ └────────┴─────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Animations
- Sidebar slides in from left (250ms delay)
- Top navbar fades in (500ms delay)
- 4 stat cards stagger in (700-1000ms delays) with count-up
- Bar chart bars grow from bottom (1200ms+ delays)
- Donut chart draws clockwise (1200ms delay)

---

## Scene 2: Lead Management
**Layout**: Split (Text Left | Interface Right)
**Background**: Purple/Indigo gradient

### Layout
```
┌───────────────┬──────────────────────────┐
│ 🌟 Badge      │  ┌────────────────────┐  │
│               │  │ Active Leads Table │  │
│ Capture &     │  ├──┬──────┬────┬────┤  │
│ Qualify...    │  │✓ │Sarah │Qual│$45K│  │
│               │  │✓ │Michael│Con│$32K│◄─┤ Selected
│ ✓ Custom...   │  │✓ │Emily │Neg │$78K│  │
│ ✓ AI-powered  │  │✓ │David │New │$25K│  │
│ ✓ Auto...     │  └──┴──────┴────┴────┘  │
│ ✓ Complete... │      ┌─────────────┐    │
│               │      │ Side Panel  │    │
│               │      │ Profile     │    │
│               │      │ Timeline    │    │
│               │      │ Notes       │    │
│               │      └─────────────┘    │
└───────────────┴──────────────────────────┘
```

### Animations
- Badge fades in (0ms)
- Title slides in (200ms)
- Bullets stagger in (400-700ms)
- Table rows appear (600-900ms)
- Row 2 highlights (800ms)
- Side panel slides in (800ms)

---

## Scene 3: WhatsApp Inbox
**Layout**: Three-column messaging interface
**Background**: Green/Emerald gradient

### Layout
```
┌────────────────────────────────────────────┐
│ ┌───────┬─────────────────┬─────────────┐ │
│ │Convos │  Chat: Sarah    │             │ │
│ │       │ ┌─────────────┐ │             │ │
│ │[S] Sa │ │◄ Hi! Inter...│ │             │ │
│ │[M] Mi │ │Thanks for... ►│ │             │ │
│ │[E] Em │ │◄ That would...│ │             │ │
│ │       │ │              │ │             │ │
│ │       │ │◄ ●●● Typing  │ │ (1s delay) │ │
│ │       │ │◄ I'm free... │ │ (1.5s)     │ │
│ │       │ └─────────────┘ │             │ │
│ │       │ 🌟 AI Suggestions│ (2s)       │ │
│ │       │ [Perfect!][Check][Send link]  │ │
│ │       │ ┌────────────┐ │             │ │
│ │       │ │Type msg... │[Send]         │ │
│ │       │ └────────────┘ │             │ │
│ └───────┴─────────────────┴─────────────┘ │
└────────────────────────────────────────────┘
```

### Animations
- Interface scales in (0ms)
- Messages appear (immediate)
- Typing indicator fades in (1000ms)
- New message slides up (1500ms)
- AI suggestion chips slide up (2000ms)
- Send button pulses continuously

---

## Scene 4: Sales Pipeline (Kanban)
**Layout**: 5-column board
**Background**: Blue/Indigo gradient

### Layout
```
┌────────────────────────────────────────────┐
│        Sales Pipeline - $575K Total        │
│ ┌────┬────┬────┬────┬────┐               │
│ │New │Qual│Prop│Nego│Won │               │
│ │ 2  │ 2  │ 1  │ 1  │ 1  │ ← Counts     │
│ ├────┼────┼────┼────┼────┤               │
│ │$45K│$78K│120K│    │150K│               │
│ │$32K│$55K│    │ 95K│    │               │
│ │    │    │    │  ↓ ⟶ ⟶ ↓│ ← Card flies │
│ └────┴────┴────┴────┴────┘   (1.2s)     │
│                                            │
│         $575K (counter animates up)        │
└────────────────────────────────────────────┘
```

### Animations
- Columns stagger in (0-400ms delays)
- Cards appear per column (600ms+ delays)
- Card flies from Negotiation → Won (1200ms)
- Revenue counter counts up (1200ms)

---

## Scene 5: Analytics Dashboard
**Layout**: 4 metric cards + 3 chart grid
**Background**: Purple/Pink gradient

### Layout
```
┌────────────────────────────────────────────┐
│    Analytics & Insights                    │
│ ┌────┬────┬────┬────┐                     │
│ │24% │$52K│18d │68% │ ← Metrics count up │
│ └────┴────┴────┴────┘                     │
│ ┌────────┬────────┬────────┐             │
│ │ Line   │ Bar    │ Donut  │             │
│ │ Chart  │ Chart  │ Chart  │             │
│ │ /‾\  /│ ▄█ ▅█ █│  ◷     │             │
│ │/   \/  │ ▅█ ▆█ █│ ◶○     │             │
│ └────────┴────────┴────────┘             │
└────────────────────────────────────────────┘
```

### Animations
- Metric cards slide up (0-300ms delays)
- Numbers count up (300ms+ delays)
- Line chart draws path (600ms)
- Bar chart bars grow (700-1300ms)
- Donut segments draw clockwise (800-1000ms)

---

## Scene 6: Calendar View
**Layout**: Month grid with modal
**Background**: Cyan/Blue gradient

### Layout
```
┌────────────────────────────────────────────┐
│     Calendar & Scheduling                  │
│ ┌──────────────────────────────────────┐  │
│ │ January 2024              [Today]    │  │
│ │ Sun Mon Tue Wed Thu Fri Sat          │  │
│ │  •   1   2   3   4   •   6   (dots = │  │
│ │  7   8   9  10  11   •  13   events) │  │
│ │ 14  15  16  17  [18] 19  20          │  │
│ │ 21  22  23   •  25  26  27           │  │
│ └──────────────────────────────────────┘  │
│         ┌─────────────────┐               │
│         │ New Meeting     │ (modal 1s)   │
│         │ Sarah Johnson   │               │
│         │ Jan 18 | 2:00PM │               │
│         │ [Create Meeting]│               │
│         └─────────────────┘               │
└────────────────────────────────────────────┘
```

### Animations
- Calendar grid appears (0ms)
- Event dots fade in staggered (400ms+ delays)
- Modal scales in center (1000ms)

---

## Scene 7: Automation Workflow
**Layout**: Node-based flow diagram
**Background**: Orange/Yellow gradient

### Layout
```
┌────────────────────────────────────────────┐
│    Automation Workflows                    │
│ ┌────────────────────────────────────────┐│
│ │  ┌──┐     ┌──┐     ┌──┐     ┌──┐     ││
│ │  │⚡│ ──→ │✓ │ ──→ │📧│ ──→ │👤│     ││
│ │  │  │     │  │     │💬│     │  │     ││
│ │  └──┘     └──┘     └──┘     └──┘     ││
│ │ Trigger  Condition Actions  Update    ││
│ │ New Lead If Qual  Email+WA  Status    ││
│ └────────────────────────────────────────┘│
│          ● Workflow Active                 │
└────────────────────────────────────────────┘
```

### Animations
- Nodes scale in sequentially (300-2300ms delays)
- Arrows fade in between nodes (800-2100ms)
- Nodes pulse continuously
- Status badge fades in (2500ms)

---

## Scene 8: Team Collaboration
**Layout**: Two-column (Activity Feed | Comments)
**Background**: Teal/Cyan gradient

### Layout
```
┌─────────────────┬──────────────────────────┐
│ Activity Feed   │  Comments                │
│ ┌─────────────┐ │  ┌──────────────────┐   │
│ │[S] Sarah... │ │  │[S] Great progress│   │
│ │[M] Michael..│ │  │    @Michael can..│   │
│ │[E] Emily... │ │  │[M] On it!       │   │
│ │[D] David... │ │  └──────────────────┘   │
│ └─────────────┘ │  ┌──────────────────┐   │
│ 🟢 Online       │  │✓ Task assigned   │   │
│                 │  └──────────────────┘   │
│                 │  [S][M][E] 3 viewing 🟢  │
└─────────────────┴──────────────────────────┘
```

### Animations
- Activity items slide in left (400-1000ms)
- Comments fade in (600-1000ms)
- @mentions highlighted in indigo
- Task notification slides up (1200ms)
- Live viewing indicator fades in (1500ms)
- Presence dots animate continuously

---

## Scene 9: Final CTA
**Layout**: Centered content with dashboard preview
**Background**: Indigo/Purple gradient with orbs

### Layout
```
┌────────────────────────────────────────────┐
│     ┌────────────────────────────┐        │
│     │   Dashboard Preview        │        │
│     │   ┌──┬──┬──┬──┐            │        │
│     │   └──┴──┴──┴──┘            │        │
│     │   ┌──────┬──────┐          │        │
│     │   └──────┴──────┘          │        │
│     └────────────────────────────┘        │
│                                            │
│              [N] Logo                      │
│                                            │
│       Ready to grow your business?        │
│    Join thousands of teams already...     │
│                                            │
│    [Start Free Trial]  [Book Demo]        │
│                                            │
│   No credit card • 14-day trial • Cancel  │
└────────────────────────────────────────────┘
```

### Animations
- Dashboard preview scales in (0ms)
- Logo pulses (0ms)
- Text fades in with scale (300ms)
- Buttons appear with hover lift effects
- Background orbs pulse continuously

---

## Technical Specifications

### Animation Properties
- **Duration**: 300-500ms for most transitions
- **Easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring-like)
- **Properties**: `transform` and `opacity` only (GPU-accelerated)
- **Fill Mode**: `forwards` to maintain final state

### Scene Detection
- Uses scroll position divided by window height
- Updates `activeScene` state (0-8)
- Conditional rendering based on `activeScene >= sceneNumber`

### Performance
- Only visible scenes render animations
- All timers cleaned up in useEffect returns
- Transform/opacity for 60fps animations
- Snap-scroll for smooth scene transitions

### Responsive Design
- Optimized for desktop (1280px+)
- Tablet compatible (768px-1279px)
- Mobile: Consider alternative simplified version

---

## Color Palette

### Primary
- Indigo: `#4F46E5` (indigo-500), `#6366F1` (indigo-400)
- Purple: `#A855F7` (purple-500), `#C084FC` (purple-400)

### Scene Backgrounds
- Scene 1: Indigo/Purple/Black gradient
- Scene 2: Purple/Black/Indigo gradient
- Scene 3: Green/Black/Emerald gradient
- Scene 4: Blue/Black/Indigo gradient
- Scene 5: Purple/Black/Pink gradient
- Scene 6: Cyan/Black/Blue gradient
- Scene 7: Orange/Black/Yellow gradient
- Scene 8: Teal/Black/Cyan gradient
- Scene 9: Indigo/Purple/Black gradient

### UI Elements
- Glass cards: `bg-white/5`, `backdrop-blur-sm`, `border-white/10`
- Text: `text-white` with varying opacity (60%, 80%, 100%)
- Buttons: Gradient `from-indigo-500 to-purple-500`

---

## User Interactions

### Supported
- ✅ Scroll to navigate (vertical, snap-enabled)
- ✅ ESC key to close
- ✅ Click close button (top-right)
- ✅ Hover effects on interactive elements

### Not Supported
- ❌ Horizontal scrolling
- ❌ Keyboard arrow navigation
- ❌ Touch/swipe gestures (uses native scroll)
- ❌ Click to advance scenes

---

## Accessibility

### Implemented
- Semantic HTML structure
- ARIA label on close button
- Keyboard support (ESC to close)
- Focus management (body scroll lock)

### Considerations
- Add skip-to-scene navigation for keyboard users
- Provide alternative text descriptions
- Consider motion preferences (reduce animations)
- Add progress indicator for screen readers
