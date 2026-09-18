# Integration Guide: Replacing ProductDemoModal with ScrollytellingDemo

This guide shows how to replace the existing `ProductDemoModal` with the new `ScrollytellingDemo` component.

## Step 1: Update Import Statements

**Before:**
```tsx
import { ProductDemoModal } from '@/components/demo/product-demo-modal';
```

**After:**
```tsx
import { ScrollytellingDemo } from '@/components/demo/scrollytelling-demo';
```

## Step 2: Replace Component Usage

**Before:**
```tsx
<ProductDemoModal 
  isOpen={isDemoOpen} 
  onClose={() => setIsDemoOpen(false)} 
/>
```

**After:**
```tsx
<ScrollytellingDemo 
  isOpen={isDemoOpen} 
  onClose={() => setIsDemoOpen(false)} 
/>
```

The props interface is identical, so it's a drop-in replacement!

## Complete Example: Landing Page

```tsx
'use client';

import { useState } from 'react';
import { ScrollytellingDemo } from '@/components/demo/scrollytelling-demo';
import { Play } from 'lucide-react';

export function LandingPage() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-white mb-6">
            Manage Relationships. Close More Deals.
          </h1>
          <p className="text-2xl text-white/80 mb-12">
            The CRM platform designed for modern sales teams
          </p>

          {/* Demo Button */}
          <button
            onClick={() => setIsDemoOpen(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold rounded-xl hover:scale-105 transition-transform duration-300 shadow-2xl"
          >
            <Play className="h-6 w-6" />
            Watch Interactive Demo
          </button>
        </div>
      </div>

      {/* Scrollytelling Demo Modal */}
      <ScrollytellingDemo 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
      />
    </div>
  );
}
```

## Example: Navigation Bar

```tsx
'use client';

import { useState } from 'react';
import { ScrollytellingDemo } from '@/components/demo/scrollytelling-demo';

export function Navbar() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <>
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-white">NexaCRM</div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDemoOpen(true)}
              className="px-4 py-2 text-white hover:text-indigo-400 transition-colors"
            >
              Demo
            </button>
            <button className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <ScrollytellingDemo 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
      />
    </>
  );
}
```

## Example: Feature Section with Auto-Open

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ScrollytellingDemo } from '@/components/demo/scrollytelling-demo';

export function FeaturesSection() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Auto-open demo after 3 seconds (optional)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDemoOpen(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            See NexaCRM in Action
          </h2>
          <button
            onClick={() => setIsDemoOpen(true)}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
          >
            Launch Interactive Tour
          </button>
        </div>
      </section>

      <ScrollytellingDemo 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
      />
    </>
  );
}
```

## Example: Modal Trigger from Multiple Places

```tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ScrollytellingDemo } from '@/components/demo/scrollytelling-demo';

// Create context for global demo control
const DemoContext = createContext<{
  openDemo: () => void;
  closeDemo: () => void;
} | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const openDemo = () => setIsDemoOpen(true);
  const closeDemo = () => setIsDemoOpen(false);

  return (
    <DemoContext.Provider value={{ openDemo, closeDemo }}>
      {children}
      <ScrollytellingDemo isOpen={isDemoOpen} onClose={closeDemo} />
    </DemoContext.Provider>
  );
}

// Hook to use demo controls anywhere
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
}

// Usage in any component:
function AnyComponent() {
  const { openDemo } = useDemo();

  return (
    <button onClick={openDemo}>
      Watch Demo
    </button>
  );
}
```

## Migration Checklist

- [ ] Import `ScrollytellingDemo` instead of `ProductDemoModal`
- [ ] Replace component usage (props are identical)
- [ ] Test on different screen sizes (optimized for desktop/tablet)
- [ ] Verify ESC key closes the modal
- [ ] Check that body scroll is locked when modal is open
- [ ] Ensure smooth animations on your target browsers
- [ ] Test all 9 scenes scroll correctly
- [ ] Verify close button works in all scenarios

## Differences from ProductDemoModal

### Removed Features
- ❌ Play/Pause controls (now scroll-based)
- ❌ Progress bar with time scrubbing
- ❌ Scene duration timing
- ❌ Next/Previous buttons

### New Features
- ✅ Scroll-based navigation (natural user control)
- ✅ 9 detailed scenes with realistic UI mockups
- ✅ Premium animations with GPU acceleration
- ✅ Interactive elements (hover states, micro-interactions)
- ✅ Real CRM interface designs (not just text slides)
- ✅ Snap-scroll for precise scene alignment
- ✅ Scene-aware animations (only animate visible scenes)

## Performance Considerations

The ScrollytellingDemo is optimized for performance:

1. **Conditional Rendering**: Only animates scenes when `activeScene` matches
2. **GPU Acceleration**: All animations use `transform` and `opacity`
3. **Cleanup**: All timers and event listeners are properly cleaned up
4. **Scroll Optimization**: Uses native CSS snap-scroll (hardware accelerated)

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (CSS snap-scroll requires `-webkit` prefix, already included)
- **Mobile**: Optimized for tablet, phone experience may vary (consider showing a simplified version)

## Troubleshooting

### Animations not playing
- Ensure `activeScene` state is updating correctly
- Check that `animationFillMode: 'forwards'` is present in style props
- Verify Tailwind CSS is processing the animations

### Scroll not snapping
- Check that `scroll-snap-type: y mandatory` is applied to container
- Ensure each section has `scroll-snap-align: start`
- Verify browser supports CSS Scroll Snap

### Performance issues
- Check if too many scenes are rendering at once
- Verify animations are using transform/opacity only
- Consider reducing animation complexity for older devices

## Support

For issues or questions, check:
- Component README.md
- Tailwind CSS documentation
- React animation best practices
