# Scrollytelling Demo Component

A premium, full-screen scrollytelling product demo for NexaCRM featuring 9 interactive scenes with realistic CRM interface mockups and smooth animations.

## Features

### 🎬 9 Premium Scenes

1. **Welcome & Dashboard Loading** - Animated dashboard with staggered element entrance
2. **Lead Management** - Interactive table with side panel details
3. **WhatsApp Inbox** - Complete messaging interface with typing indicators
4. **Sales Pipeline** - Kanban board with animated card movement
5. **Analytics Dashboard** - Animated charts and metrics
6. **Calendar View** - Month grid with event creation modal
7. **Automation Workflow** - Node-based workflow builder with connections
8. **Team Collaboration** - Activity feed with live collaboration indicators
9. **Final CTA** - Call-to-action with dashboard preview

### ✨ Animations

- **GPU-Accelerated**: Uses only `transform` and `opacity` for 60fps performance
- **Spring Easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` for natural motion
- **Staggered Delays**: Elements animate in sequence for visual hierarchy
- **Count-Up Numbers**: Animated number counters for metrics
- **Chart Drawing**: SVG path animations for data visualization
- **Micro-Interactions**: Hover lifts, pulses, and transitions

### 🎨 Visual Design

- **Glass Morphism**: `backdrop-blur-sm` with semi-transparent backgrounds
- **Gradient Accents**: Indigo to purple gradient theme
- **Smooth Shadows**: `shadow-2xl` for depth
- **Rounded Corners**: `rounded-xl` throughout
- **Professional Spacing**: Consistent padding and gaps

### 🔧 Technical

- **TypeScript**: Fully typed component
- **React Hooks**: `useState`, `useEffect`, `useRef`, `useCallback`
- **Snap Scrolling**: Each scene is full-screen with snap-scroll
- **Keyboard Support**: ESC key to close
- **Body Scroll Lock**: Prevents background scrolling
- **Active Scene Tracking**: IntersectionObserver-based scroll tracking

## Usage

```tsx
import { ScrollytellingDemo } from '@/components/demo/scrollytelling-demo';

function Page() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsDemoOpen(true)}>
        Watch Demo
      </button>

      <ScrollytellingDemo 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
      />
    </>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls visibility of the demo modal |
| `onClose` | `() => void` | Callback function when demo is closed |

## Keyboard Shortcuts

- **ESC** - Close demo

## Performance

- Each scene conditionally renders based on `activeScene` state
- Animations use CSS transforms (GPU-accelerated)
- Timers are cleaned up in `useEffect` cleanup functions
- No layout thrashing - uses `will-change` implicitly via transforms

## Browser Support

- Modern browsers with CSS Grid, Flexbox, and CSS animations
- Snap scrolling requires `-webkit-overflow-scrolling` or `scroll-snap-type` support

## Customization

### Colors

The component uses Tailwind CSS utility classes. To change the color scheme:

- Primary gradient: `from-indigo-500 to-purple-500`
- Background: `from-indigo-900 via-purple-900 to-black`
- Accents: Various indigo, purple, and white opacity variations

### Animation Timing

Modify delay values in `style={{ animationDelay: '...ms' }}` props to adjust timing.

### Scene Content

Each scene's content is self-contained within its `<section>` block. Modify the JSX to change content while maintaining the animation structure.

## Dependencies

- `react` - Core React library
- `lucide-react` - Icon library
- Tailwind CSS - Utility-first CSS framework

## File Structure

```
scrollytelling-demo.tsx (1298 lines)
├── Imports & Types (30 lines)
├── CountUpNumber Component (25 lines)
├── BrowserChrome Component (20 lines)
├── Main ScrollytellingDemo Component
│   ├── State & Effects (40 lines)
│   ├── Scene 1: Welcome (80 lines)
│   ├── Scene 2: Lead Management (90 lines)
│   ├── Scene 3: WhatsApp Inbox (120 lines)
│   ├── Scene 4: Sales Pipeline (110 lines)
│   ├── Scene 5: Analytics (100 lines)
│   ├── Scene 6: Calendar (90 lines)
│   ├── Scene 7: Automation (100 lines)
│   ├── Scene 8: Team Collaboration (110 lines)
│   ├── Scene 9: Final CTA (70 lines)
│   └── Styles (300 lines)
```

## Notes

- All animations are production-ready
- No placeholder content - every scene is fully designed
- Responsive design (optimized for desktop, adapts to tablet)
- Professional gradient backgrounds on each scene
- Realistic CRM data and UI elements throughout
